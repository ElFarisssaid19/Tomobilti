<?php

namespace App\Http\Controllers\Reservation;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Services\ReservationDocuments;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/**
 * PDFs of my own reservations. Someone else's reservation, a voucher before the
 * agency confirmed, or an invoice not issued yet all answer 404.
 */
class ReservationDocumentController extends Controller
{
    public function __construct(private ReservationDocuments $documents) {}

    /**
     * GET /api/reservations/{reference}/voucher: confirmed, active or completed.
     */
    public function voucher(Reservation $reservation): Response
    {
        Gate::authorize('downloadVoucher', $reservation);

        return $this->documents->voucher($reservation)->download($reservation->voucherFilename());
    }

    /**
     * GET /api/reservations/{reference}/invoice: once issued at pick-up.
     */
    public function invoice(Reservation $reservation): Response
    {
        Gate::authorize('downloadInvoice', $reservation);

        return $this->documents->invoice($reservation->invoice)->download($reservation->invoice->pdfFilename());
    }
}
