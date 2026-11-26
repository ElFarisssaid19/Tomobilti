<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\Agency\AgencyNotification;
use App\Notifications\Agency\NewReservationRequest;
use App\Notifications\Agency\ReservationCancelledByClient;
use App\Notifications\Client\InvoiceIssued;
use App\Notifications\Client\PickupReminder;
use App\Notifications\Client\ReservationCancelled;
use App\Notifications\Client\ReservationCompleted;
use App\Notifications\Client\ReservationConfirmed;
use App\Notifications\Client\ReservationRejected;
use App\Notifications\Client\ReservationRequested;
use Illuminate\Support\Facades\Notification;

/**
 * Who hears about each reservation event (Phase 6). Called once per event by
 * ReservationBooker, ReservationWorkflow, the invoice actions and the reminder
 * command, from inside their transaction: every notification is queued after the
 * commit (ReservationNotification::afterCommit), so a refused or rolled-back change
 * never sends anything, and the row lock of the change guarantees it happens once.
 *
 * | Event                         | Client                | Agency (email + admins in-app) |
 * | ----------------------------- | --------------------- | ------------------------------ |
 * | booked (pending)              | email                 | yes                            |
 * | confirmed                     | email + PDF, in-app   |                                |
 * | refused (agency or expired)   | email, in-app         |                                |
 * | cancelled by the customer     | email                 | yes                            |
 * | cancelled by the agency       | email, in-app         |                                |
 * | pick-up reminder (24 h)       | email, in-app         |                                |
 * | invoice issued at pick-up     | email + PDF, in-app   |                                |
 * | invoice sent again            | email + PDF           |                                |
 * | returned                      | email ("merci")       |                                |
 */
class ReservationNotifier
{
    public function requested(Reservation $reservation): void
    {
        $reservation->user->notify(new ReservationRequested($reservation));
        $this->notifyAgency(new NewReservationRequest($reservation));
    }

    public function confirmed(Reservation $reservation): void
    {
        $reservation->user->notify(new ReservationConfirmed($reservation));
    }

    public function rejected(Reservation $reservation): void
    {
        $reservation->user->notify(new ReservationRejected($reservation));
    }

    /**
     * @param  bool  $byAgency  false when the customer cancelled
     */
    public function cancelled(Reservation $reservation, bool $byAgency): void
    {
        $reservation->user->notify(new ReservationCancelled($reservation, $byAgency));

        if (! $byAgency) {
            $this->notifyAgency(new ReservationCancelledByClient($reservation));
        }
    }

    public function reminder(Reservation $reservation): void
    {
        $reservation->user->notify(new PickupReminder($reservation));
    }

    /**
     * @param  bool  $resent  the agency sends an existing invoice again (email only)
     */
    public function invoiceIssued(Invoice $invoice, bool $resent = false): void
    {
        $invoice->reservation->user->notify(new InvoiceIssued($invoice, $resent));
    }

    public function completed(Reservation $reservation): void
    {
        $reservation->user->notify(new ReservationCompleted($reservation));
    }

    /**
     * The agency's mailbox gets the email, every active admin the in-app notification.
     */
    private function notifyAgency(AgencyNotification $notification): void
    {
        Notification::route('mail', config('tomobilti.agency.email'))->notify($notification);

        Notification::send(
            User::query()->where('role', UserRole::Admin)->where('is_active', true)->get(),
            $notification,
        );
    }
}
