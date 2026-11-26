<?php

namespace App\Services;

use App\Enums\ExtraPricing;
use App\Models\Invoice;
use App\Models\Reservation;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdf;

/**
 * The two PDFs of a reservation, in French, made for printing (A4, light):
 *
 *  - the booking voucher ("bon de réservation"), once the agency has confirmed;
 *  - the invoice ("facture"), issued when the customer picks the car up and pays.
 *
 * Rendered with dompdf (pure PHP) from resources/views/pdf, with Plus Jakarta Sans
 * (OFL, resources/fonts) embedded as a subset so French accents print everywhere.
 */
class ReservationDocuments
{
    /**
     * Relations both documents read.
     *
     * @var list<string>
     */
    public const RELATIONS = ['user', 'car.brand', 'pickupLocation', 'returnLocation', 'extras', 'invoice'];

    public function voucher(Reservation $reservation): DomPdf
    {
        $reservation->loadMissing(self::RELATIONS);

        return $this->render('pdf.voucher', [
            'reservation' => $reservation,
            'pricing' => PriceBreakdown::fromReservation($reservation),
            'lines' => $this->lines($reservation),
            'documents' => __('api.documents.to_bring'),
            'title' => "Bon de réservation {$reservation->reference}",
        ]);
    }

    public function invoice(Invoice $invoice): DomPdf
    {
        $invoice->loadMissing(array_map(fn (string $relation): string => "reservation.{$relation}", self::RELATIONS));
        $reservation = $invoice->reservation;

        return $this->render('pdf.invoice', [
            'invoice' => $invoice,
            'reservation' => $reservation,
            'lines' => $this->lines($reservation),
            'amountInWords' => FrenchFormatter::amountInWords((string) $invoice->total_ttc),
            'title' => "Facture {$invoice->number}",
        ]);
    }

    /**
     * Lines of the price (amounts TTC, as booked): the rental, each option, the one-way
     * fee. They add up to the reservation total.
     *
     * @return list<array{label: string, detail: string, amount: string}>
     */
    public function lines(Reservation $reservation): array
    {
        $reservation->loadMissing(['car.brand', 'extras']);
        $days = $reservation->days;
        $dayWord = $days > 1 ? 'jours' : 'jour';

        $lines = [[
            'label' => "Location {$reservation->car->brand->name} {$reservation->car->model}",
            'detail' => "{$days} {$dayWord} × ".FrenchFormatter::money((string) $reservation->price_per_day),
            'amount' => bcmul((string) $reservation->price_per_day, (string) $days, 2),
        ]];

        foreach ($reservation->extras as $extra) {
            $pivot = $extra->pivot;
            $quantity = $pivot->quantity > 1 ? "{$pivot->quantity} × " : '';
            $detail = $pivot->pricing === ExtraPricing::PerDay
                ? "{$quantity}{$days} {$dayWord} × ".FrenchFormatter::money((string) $pivot->unit_price)
                : $quantity.FrenchFormatter::money((string) $pivot->unit_price).' par location';

            $lines[] = ['label' => $extra->name, 'detail' => $detail, 'amount' => (string) $pivot->total];
        }

        if (bccomp((string) $reservation->one_way_fee, '0', 2) > 0) {
            $lines[] = [
                'label' => __('api.documents.one_way_fee'),
                'detail' => "{$reservation->pickupLocation->name} → {$reservation->returnLocation->name}",
                'amount' => (string) $reservation->one_way_fee,
            ];
        }

        return $lines;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function render(string $view, array $data): DomPdf
    {
        return Pdf::loadView($view, [...$data, 'company' => config('tomobilti.company')])
            ->setPaper('a4')
            ->setOption([
                'enable_font_subsetting' => true,
                'default_font' => 'Plus Jakarta Sans',
                'dpi' => 96,
            ]);
    }
}
