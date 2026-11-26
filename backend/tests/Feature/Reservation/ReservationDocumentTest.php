<?php

namespace Tests\Feature\Reservation;

use App\Models\Car;
use App\Models\Extra;
use App\Models\Invoice;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use App\Services\ReservationDocuments;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ReservationDocumentTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->user = User::factory()->create();
    }

    /**
     * @return array<string, array{string, bool}>
     */
    public static function voucherByStatus(): array
    {
        return [
            'pending' => ['pending', false],
            'confirmed' => ['confirmed', true],
            'active' => ['active', true],
            'completed' => ['completed', true],
            'cancelled' => ['cancelled', false],
            'rejected' => ['rejected', false],
        ];
    }

    #[DataProvider('voucherByStatus')]
    public function test_the_voucher_exists_once_the_agency_confirmed(string $status, bool $available): void
    {
        $reservation = Reservation::factory()->for($this->user)->{$status}()->create();

        $response = $this->actingAs($this->user)->get("/api/reservations/{$reservation->reference}/voucher");

        if ($available) {
            $response->assertOk()->assertHeader('content-type', 'application/pdf')->assertDownload("bon-de-reservation-{$reservation->reference}.pdf");
        } else {
            $response->assertNotFound();
        }

        $this->actingAs($this->user)
            ->getJson("/api/reservations/{$reservation->reference}")
            ->assertJsonPath('data.has_voucher', $available);
    }

    public function test_the_invoice_is_downloadable_once_issued(): void
    {
        $reservation = Reservation::factory()->for($this->user)->active()->create();

        $this->actingAs($this->user)->getJson("/api/reservations/{$reservation->reference}/invoice")->assertNotFound();

        $invoice = Invoice::factory()->for($reservation)->create();

        $this->actingAs($this->user)
            ->get("/api/reservations/{$reservation->reference}/invoice")
            ->assertOk()
            ->assertDownload("facture-{$invoice->number}.pdf");

        $this->actingAs($this->user)
            ->getJson('/api/reservations?tab=current')
            ->assertJsonPath('data.0.invoice.number', $invoice->number);
    }

    public function test_someone_elses_documents_answer_404(): void
    {
        $invoice = Invoice::factory()->create();
        $reference = $invoice->reservation->reference;

        $this->actingAs($this->user)->getJson("/api/reservations/{$reference}/voucher")->assertNotFound();
        $this->actingAs($this->user)->getJson("/api/reservations/{$reference}/invoice")->assertNotFound();
    }

    public function test_guests_must_sign_in(): void
    {
        $reservation = Reservation::factory()->confirmed()->create();

        $this->getJson("/api/reservations/{$reservation->reference}/voucher")->assertUnauthorized();
    }

    public function test_the_invoice_lines_add_up_to_the_total(): void
    {
        $gueliz = Location::factory()->create(['name' => 'Marrakech Guéliz']);
        $agadir = Location::factory()->create(['name' => 'Agadir Al Massira']);
        $reservation = Reservation::factory()
            ->for(Car::factory()->for($gueliz)->state(['model' => 'Clio']))
            ->completed()
            ->create(['days' => 3, 'price_per_day' => '300.00', 'one_way_fee' => '300.00', 'extras_total' => '150.00', 'total' => '1350.00', 'pickup_location_id' => $gueliz->id, 'return_location_id' => $agadir->id]);
        $reservation->extras()->attach(Extra::factory()->create(['name' => 'GPS'])->id, ['quantity' => 1, 'unit_price' => '50.00', 'pricing' => 'per_day', 'total' => '150.00']);

        $lines = app(ReservationDocuments::class)->lines($reservation->refresh());

        $this->assertSame(['3 jours × 300,00 DH', '3 jours × 50,00 DH', 'Marrakech Guéliz → Agadir Al Massira'], str_replace("\u{00A0}", ' ', array_column($lines, 'detail')));
        $this->assertSame(['900.00', '150.00', '300.00'], array_column($lines, 'amount'));
        $this->assertSame('Frais d’abandon', $lines[2]['label']);
    }

    public function test_the_invoice_pdf_prints_the_vat_split_and_the_amount_in_words(): void
    {
        if ((new Process(['which', 'pdftotext']))->run() !== 0) {
            $this->markTestSkipped('pdftotext (poppler-utils) is not installed.');
        }

        $reservation = Reservation::factory()->for($this->user)->completed()->create(['total' => '1234.50']);
        $invoice = Invoice::factory()->paid()->for($reservation)->create();

        $path = tempnam(sys_get_temp_dir(), 'facture');
        file_put_contents($path, $this->actingAs($this->user)->get("/api/reservations/{$reservation->reference}/invoice")->getContent());
        $process = new Process(['pdftotext', '-layout', $path, '-']);
        $process->run();
        unlink($path);

        $text = preg_replace('/\s+/u', ' ', str_replace("\u{00A0}", ' ', $process->getOutput()));
        $this->assertStringContainsString("Facture N° {$invoice->number}", $text);
        $this->assertStringContainsString('Total HT 1 028,75 DH', $text);
        $this->assertStringContainsString('TVA 20 % 205,75 DH', $text);
        $this->assertStringContainsString('1 234,50 DH', $text);
        $this->assertStringContainsString('Arrêtée la présente facture à la somme de mille deux cent trente-quatre dirhams et cinquante centimes TTC.', $text);
        $this->assertStringContainsString('Carte bancaire', $text);
    }
}
