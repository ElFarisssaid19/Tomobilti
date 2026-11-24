<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ReservationStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ClientIndexRequest;
use App\Http\Resources\Admin\AdminClientResource;
use App\Http\Resources\Admin\AdminReservationResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/**
 * Customer accounts (staff accounts are not listed here).
 */
class ClientController extends Controller
{
    /**
     * GET /api/admin/clients?q=&active=&verified=&sort=: 15 per page, each with its
     * number of reservations and the total of its completed ones (two subqueries).
     */
    public function index(ClientIndexRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', User::class);

        $query = $this->withTotals(User::query()->where('role', UserRole::Client));

        if (filled($search = trim((string) $request->validated('q')))) {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $phone = ltrim((string) preg_replace('/[\s.\-()]/', '', $search), '0+');

            $query->where(fn (Builder $match) => $match
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->when($phone !== '', fn (Builder $byPhone) => $byPhone->orWhere('phone', 'like', "%{$phone}%")));
        }

        if ($request->filled('active')) {
            $query->where('is_active', $request->validated('active') === '1');
        }

        if ($request->filled('verified')) {
            $request->validated('verified') === '1'
                ? $query->whereNotNull('email_verified_at')
                : $query->whereNull('email_verified_at');
        }

        $sort = $request->validated('sort') ?? 'created_at';
        $direction = $request->validated('direction') ?? ($sort === 'name' ? 'asc' : 'desc');

        $clients = $query->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return AdminClientResource::collection($clients);
    }

    /**
     * GET /api/admin/clients/{id}: profile, totals per status and every reservation
     * (latest pick-up first). A staff account answers 404.
     */
    public function show(User $client): JsonResponse
    {
        Gate::authorize('view', $client);

        $client = $this->withTotals(User::query())->findOrFail($client->id);
        $reservations = $client->reservations()
            ->with(AdminReservationResource::RELATIONS)
            ->orderByDesc('start_at')
            ->get();

        $byStatus = collect(ReservationStatus::cases())->mapWithKeys(fn (ReservationStatus $status): array => [
            $status->value => $reservations->where('status', $status)->count(),
        ]);

        return response()->json(['data' => [
            ...(new AdminClientResource($client))->resolve(),
            'stats' => [
                'by_status' => $byStatus,
                'upcoming' => $reservations->filter(fn ($reservation): bool => $reservation->status->blocksAvailability() && $reservation->end_at->isFuture())->count(),
                'last_reservation_at' => $reservations->max('created_at')?->toIso8601String(),
            ],
            'reservations' => AdminReservationResource::collection($reservations),
        ]]);
    }

    /**
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    private function withTotals(Builder $query): Builder
    {
        return $query
            ->withCount('reservations')
            ->withSum(['reservations' => fn (Builder $reservations) => $reservations->where('status', ReservationStatus::Completed)], 'total');
    }
}
