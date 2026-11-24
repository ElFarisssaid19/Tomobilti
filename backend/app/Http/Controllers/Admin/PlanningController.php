<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ReservationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PlanningRequest;
use App\Models\Brand;
use App\Models\Car;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class PlanningController extends Controller
{
    /**
     * GET /api/admin/planning?from=&to= (31 days at most): one row per car with its
     * reservations touching the range (cancelled and refused ones left out), for the
     * timeline. Removed cars only appear when they still have a reservation there.
     * Two queries: the cars, and their reservations (eager loaded).
     */
    public function __invoke(PlanningRequest $request): JsonResponse
    {
        Gate::authorize('manage', Reservation::class);

        $from = $request->from();
        $until = $request->to()->addDay();
        $shown = fn (Builder|HasMany $reservations) => $reservations
            ->whereNotIn('status', [ReservationStatus::Cancelled, ReservationStatus::Rejected])
            ->overlapping($from, $until);

        $cars = Car::withTrashed()
            ->where(fn (Builder $query) => $query->whereNull('deleted_at')->orWhereHas('reservations', $shown))
            ->with([
                'brand',
                'category',
                'primaryImage',
                'reservations' => fn (HasMany $reservations) => $shown($reservations)->with('user:id,name')->orderBy('start_at'),
            ])
            ->orderBy(Brand::select('name')->whereColumn('brands.id', 'cars.brand_id'))
            ->orderBy('model')
            ->orderBy('year')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => [
            'from' => $from->toDateString(),
            'to' => $request->to()->toDateString(),
            'cars' => $cars->map(fn (Car $car): array => [
                'id' => $car->id,
                'name' => "{$car->brand->name} {$car->model}",
                'year' => $car->year,
                'plate_number' => $car->plate_number,
                'status' => $car->status->value,
                'status_label' => $car->status->label(),
                'category' => $car->category->name,
                'thumbnail_url' => $car->primaryImage?->thumbnail_url,
                'is_deleted' => $car->trashed(),
                'reservations' => $car->reservations->map(fn (Reservation $reservation): array => [
                    'reference' => $reservation->reference,
                    'status' => $reservation->status->value,
                    'status_label' => $reservation->status->label(),
                    'start_at' => $reservation->start_at->toIso8601String(),
                    'end_at' => $reservation->end_at->toIso8601String(),
                    'client' => $reservation->user->name,
                ])->values(),
            ])->values(),
        ]]);
    }
}
