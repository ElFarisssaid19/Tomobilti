<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Back-office invoices (discovered automatically for Invoice). Customers download
 * their own invoice through the ReservationPolicy (downloadInvoice).
 */
class InvoicePolicy
{
    /**
     * List, download and send invoices again.
     */
    public function manage(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only an unpaid invoice can be marked as paid.
     */
    public function markPaid(User $user, Invoice $invoice): Response
    {
        if (! $user->isAdmin()) {
            return Response::deny();
        }

        return $invoice->isPaid() ? Response::deny(__('api.invoices.already_paid')) : Response::allow();
    }
}
