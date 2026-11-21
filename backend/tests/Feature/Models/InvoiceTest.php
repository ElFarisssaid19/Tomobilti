<?php

namespace Tests\Feature\Models;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Models\Invoice;
use App\Models\Reservation;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_generates_sequential_numbers_from_the_issue_year(): void
    {
        $this->travelTo('2027-01-05 10:00:00');

        $first = Invoice::factory()->create(['issued_at' => '2026-12-30 10:00:00']);
        $second = Invoice::factory()->create(['issued_at' => '2026-12-31 10:00:00']);
        $third = Invoice::factory()->create();

        $this->assertSame('FAC-2026-000001', $first->number);
        $this->assertSame('FAC-2026-000002', $second->number);
        $this->assertSame('FAC-2027-000001', $third->number);
    }

    public function test_a_reservation_has_at_most_one_invoice(): void
    {
        $reservation = Reservation::factory()->completed()->create();
        Invoice::factory()->for($reservation)->create();

        $this->expectException(QueryException::class);

        Invoice::factory()->for($reservation)->create();
    }

    public function test_casts_amounts_status_and_payment(): void
    {
        $invoice = Invoice::factory()->paid()->create()->fresh();

        $this->assertSame(InvoiceStatus::Paid, $invoice->status);
        $this->assertSame(PaymentMethod::Card, $invoice->payment_method);
        $this->assertSame('20.00', $invoice->vat_rate);
        $this->assertSame($invoice->reservation->total, $invoice->total_ttc);
        $this->assertSame($invoice->total_ttc, bcadd($invoice->subtotal_ht, $invoice->vat_amount, 2));
    }

    /**
     * @return array<string, array{string, string, string}>
     */
    public static function totals(): array
    {
        return [
            'round amount' => ['1200.00', '1000.00', '200.00'],
            'rounds HT half up' => ['250.00', '208.33', '41.67'],
            'odd centimes' => ['999.99', '833.33', '166.66'],
            'zero' => ['0.00', '0.00', '0.00'],
        ];
    }

    #[DataProvider('totals')]
    public function test_split_total_extracts_ht_and_vat_from_a_ttc_amount(string $ttc, string $ht, string $vat): void
    {
        $this->assertSame(
            ['subtotal_ht' => $ht, 'vat_amount' => $vat, 'total_ttc' => $ttc],
            Invoice::splitTotal($ttc),
        );
    }
}
