<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CarStatus;
use App\Enums\ReservationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CarStatusRequest;
use App\Http\Resources\Admin\AdminCarResource;
use App\Http\Resources\Admin\AdminReservationResource;
use App\Models\Car;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/**
 * Available, in maintenance or out of service. A car that is not available leaves
 * the public catalogue and cannot be booked or confirmed; the pending and confirmed
 * reservations not over yet are listed so the admin can call those customers.
 */
class CarStatusController extends Controller
{
    /**
     * GET /api/admin/cars/{id}/status-conflicts: what a status change would affect.
     */
    public function conflicts(Car $car): AnonymousResourceCollection
    {
        Gate::authorize('changeStatus', $car);

        return AdminReservationResource::collection($this->affectedReservations($car));
    }

    /**
     * PATCH /api/admin/cars/{id}/status { status, force? }: without `force`, a change
     * that affects reservations answers 409 with them and changes nothing.
     */
    public function update(CarStatusRequest $request, Car $car): JsonResponse|AdminCarResource
    {
        Gate::authorize('changeStatus', $car);

        $status = $request->enum('status', CarStatus::class);
        $affected = $status === CarStatus::Available ? new Collection : $this->affectedReservations($car);

        if ($affected->isNotEmpty() && ! $request->boolean('force')) {
            return response()->json([
                'message' => trans_choice('api.admin.cars.status_conflicts', $affected->count()),
                'code' => 'status_conflicts',
                'reservations' => AdminReservationResource::collection($affected),
            ], 409);
        }

        $car->update(['status' => $status]);

        return (new AdminCarResource($car->load([...AdminCarResource::RELATIONS, 'images'])->loadCount('upcomingReservations')))
            ->additional([
                'message' => __('api.admin.cars.status_changed'),
                'affected_reservations' => AdminReservationResource::collection($affected),
            ]);
    }

    /**
     * Pending or confirmed reservations of this car that are not over yet.
     *
     * @return Collection<int, Reservation>
     */
    private function affectedReservations(Car $car): Collection
    {
        return $car->reservations()
            ->withStatus(ReservationStatus::Pending, ReservationStatus::Confirmed)
            ->notEnded()
            ->with(AdminReservationResource::RELATIONS)
            ->orderBy('start_at')
            ->get();
    }
}
