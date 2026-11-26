<?php

namespace App\Notifications\Client;

use App\Models\Invoice;
use App\Notifications\ReservationNotification;
use App\Services\FrenchFormatter;
use App\Services\ReservationDocuments;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * "Votre facture", with the invoice PDF attached: when the invoice is created at
 * pick-up (email and in-app), and each time the agency sends it again (email only).
 */
class InvoiceIssued extends ReservationNotification
{
    public function __construct(public Invoice $invoice, public bool $resent = false)
    {
        parent::__construct($invoice->reservation);
    }

    public function type(): string
    {
        return 'invoice.issued';
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $this->resent ? ['mail'] : ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $invoice = $this->invoice->fresh() ?? $this->invoice;

        return $this->mail(
            subject: "Votre facture {$invoice->number}",
            title: 'Votre facture',
            intro: 'Votre facture est jointe à cet e-mail. Bonne route !',
            details: [
                'Facture' => $invoice->number,
                'Réservation' => $this->reservation->reference,
                'Voiture' => $this->carName(),
                'Total TTC' => FrenchFormatter::money((string) $invoice->total_ttc),
                'Statut' => $invoice->status->label().($invoice->payment_method ? ', '.mb_strtolower($invoice->payment_method->label()) : ''),
            ],
            actionText: 'Voir ma réservation',
            actionUrl: $this->clientUrl(),
        )->attachData(
            app(ReservationDocuments::class)->invoice($invoice)->output(),
            $invoice->pdfFilename(),
            ['mime' => 'application/pdf'],
        );
    }

    protected function inAppTitle(): string
    {
        return "Facture {$this->invoice->number}";
    }

    protected function inAppBody(): string
    {
        return $this->carName().', '.FrenchFormatter::money((string) $this->invoice->total_ttc);
    }
}
