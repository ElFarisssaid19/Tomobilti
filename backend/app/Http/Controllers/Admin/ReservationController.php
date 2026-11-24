<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AdminReservationTab;
use App\Filters\AdminReservationFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReservationIndexRequest;
use App\Http\Resources\Admin\AdminReservationDetailResource;
use App\Http\Resources\Admin\AdminReservationResource;
use App\Models\Reservation;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Every reservation, for the agency: tabs, filters, detail page and CSV export.
 */
class ReservationController extends Controller
{
    /**
     * GET /api/admin/reservations: one tab (pending by default), filters and sort, 15
     * per page, with the number of reservations in every tab (meta.counts, filters
     * not applied: the sidebar badge uses the pending count).
     */
    public function index(ReservationIndexRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('manage', Reservation::class);

        $filter = new AdminReservationFilter($request->validated());

        $reservations = $filter
            ->apply(Reservation::query()->with(AdminReservationResource::RELATIONS))
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return AdminReservationResource::collection($reservations)->additional(['meta' => [
            'tab' => $filter->tab()->value,
            'counts' => collect(AdminReservationTab::cases())->mapWithKeys(function (AdminReservationTab $tab): array {
                $query = Reservation::query();
                $tab->apply($query);

                return [$tab->value => $query->count()];
            }),
        ]]);
    }

    /**
     * GET /api/admin/reservations/{reference}: client, car, agencies, extras, price
     * breakdown, notes and the full status history.
     */
    public function show(Reservation $reservation): AdminReservationDetailResource
    {
        Gate::authorize('manage', Reservation::class);

        return new AdminReservationDetailResource($reservation->load(AdminReservationDetailResource::RELATIONS));
    }

    /**
     * GET /api/admin/reservations/export: the filtered list (every page) as a CSV file
     * that Excel opens with its accents: UTF-8 with a BOM, ";" separators and decimal
     * commas, the French defaults. Rows are streamed in chunks of 200.
     */
    public function export(ReservationIndexRequest $request): StreamedResponse
    {
        Gate::authorize('manage', Reservation::class);

        $query = (new AdminReservationFilter($request->validated()))
            ->apply(Reservation::query()->with(['user', 'car.brand', 'pickupLocation', 'returnLocation']));

        $columns = ['reference', 'status', 'client', 'email', 'phone', 'car', 'plate', 'pickup_location', 'return_location', 'start_at', 'end_at', 'days', 'extras_total', 'one_way_fee', 'total', 'created_at'];

        return response()->streamDownload(function () use ($query, $columns): void {
            $output = fopen('php://output', 'w');
            fwrite($output, "\u{FEFF}");
            fputcsv($output, array_map(fn (string $column): string => __("api.admin.reservations.csv.{$column}"), $columns), ';', escape: '');

            foreach ($query->lazy(200) as $reservation) {
                fputcsv($output, [
                    $reservation->reference,
                    $reservation->status->label(),
                    $reservation->user->name,
                    $reservation->user->email,
                    $reservation->user->phone,
                    "{$reservation->car->brand->name} {$reservation->car->model} {$reservation->car->year}",
                    $reservation->car->plate_number,
                    $reservation->pickupLocation->name,
                    $reservation->returnLocation->name,
                    $reservation->start_at->format('d/m/Y H:i'),
                    $reservation->end_at->format('d/m/Y H:i'),
                    $reservation->days,
                    self::frenchDecimal($reservation->extras_total),
                    self::frenchDecimal($reservation->one_way_fee),
                    self::frenchDecimal($reservation->total),
                    $reservation->created_at->format('d/m/Y H:i'),
                ], ';', escape: '');
            }

            fclose($output);
        }, 'reservations-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * "1234.50" → "1234,50" (Excel in French reads it as a number).
     */
    private static function frenchDecimal(string $amount): string
    {
        return str_replace('.', ',', $amount);
    }
}
