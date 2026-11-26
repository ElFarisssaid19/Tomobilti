<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PickUpRequest;
use App\Http\Requests\Admin\ReservationNotesRequest;
use App\Http\Requests\Admin\ReservationReasonRequest;
use App\Http\Resources\Admin\AdminReservationDetailResource;
use App\Models\Reservation;
use App\Services\ReservationWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * What the agency does with a reservation. The ReservationPolicy refuses a move the
 * current status does not allow (403 with the French reason); ReservationWorkflow
 * checks it again under a row lock (409 if it changed meanwhile, or if the car is no
 * longer free when confirming) and writes the status history with the admin's id.
 */
class ReservationActionController extends Controller
{
    public function __construct(private ReservationWorkflow $workflow) {}

    /**
     * POST /api/admin/reservations/{reference}/confirm
     */
    public function confirm(Request $request, Reservation $reservation): AdminReservationDetailResource
    {
        Gate::authorize('confirm', $reservation);

        return $this->respond($this->workflow->confirm($reservation, $request->user()), 'confirmed');
    }

    /**
     * POST /api/admin/reservations/{reference}/reject { reason }
     */
    public function reject(ReservationReasonRequest $request, Reservation $reservation): AdminReservationDetailResource
    {
        Gate::authorize('reject', $reservation);

        return $this->respond($this->workflow->reject($reservation, $request->user(), $request->validated('reason')), 'rejected');
    }

    /**
     * POST /api/admin/reservations/{reference}/pick-up { payment_method, paid }: the
     * customer pays at the agency; the invoice is issued (paid or not) and emailed.
     * PickUpRequest checks the policy before validating.
     */
    public function pickUp(PickUpRequest $request, Reservation $reservation): AdminReservationDetailResource
    {
        return $this->respond(
            $this->workflow->markPickedUp($reservation, $request->user(), $request->paymentMethod(), $request->boolean('paid')),
            'picked_up',
        );
    }

    /**
     * POST /api/admin/reservations/{reference}/return
     */
    public function return(Request $request, Reservation $reservation): AdminReservationDetailResource
    {
        Gate::authorize('markReturned', $reservation);

        return $this->respond($this->workflow->markReturned($reservation, $request->user()), 'returned');
    }

    /**
     * POST /api/admin/reservations/{reference}/cancel { reason }
     */
    public function cancel(ReservationReasonRequest $request, Reservation $reservation): AdminReservationDetailResource
    {
        Gate::authorize('cancelAsAdmin', $reservation);

        return $this->respond($this->workflow->cancel($reservation, $request->user(), $request->validated('reason')), 'cancelled');
    }

    /**
     * PATCH /api/admin/reservations/{reference}/notes { admin_notes }: internal only.
     */
    public function notes(ReservationNotesRequest $request, Reservation $reservation): AdminReservationDetailResource
    {
        Gate::authorize('manage', Reservation::class);

        $reservation->update(['admin_notes' => $request->validated('admin_notes')]);

        return $this->respond($reservation, 'notes_saved');
    }

    private function respond(Reservation $reservation, string $message): AdminReservationDetailResource
    {
        return (new AdminReservationDetailResource($reservation->load(AdminReservationDetailResource::RELATIONS)))
            ->additional(['message' => __("api.admin.reservations.{$message}")]);
    }
}
