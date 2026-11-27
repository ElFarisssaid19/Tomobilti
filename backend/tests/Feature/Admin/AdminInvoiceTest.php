<?php

namespace Tests\Feature\Admin;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\ReservationStatus;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\Client\InvoiceIssued;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdminInvoiceTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->admin = User::factory()->admin()->create();
    }

    public function test_picking_up_and_paying_now_issues_a_paid_invoice(): void
    {
        $reservation = Reservation::factory()->between('2026-12-01 10:00', '2026-12-04 10:00')->confirmed()->create(['total' => '1250.00']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/pick-up", ['payment_method' => 'card', 'paid' => true])
            ->assertOk()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.invoice.number', 'FAC-2026-000001')
            ->assertJsonPath('data.invoice.status', 'paid')
            ->assertJsonPath('data.invoice.payment_method', 'card');

        $invoice = $reservation->refresh()->invoice;
        $this->assertSame(ReservationStatus::Active, $reservation->status);
        $this->assertSame(InvoiceStatus::Paid, $invoice->status);
        $this->assertSame(PaymentMethod::Card, $invoice->payment_method);
        $this->assertTrue($invoice->issued_at->equalTo(now()));
        $this->assertTrue($invoice->paid_at->equalTo(now()));
        $this->assertSame(['1041.67', '208.33', '1250.00'], [$invoice->subtotal_ht, $invoice->vat_amount, $invoice->total_ttc]);
    }

    public function test_picking_up_and_paying_later_issues_an_unpaid_invoice(): void
    {
        Invoice::factory()->create(['issued_at' => '2026-11-20 10:00']);
        $reservation = Reservation::factory()->between('2026-12-01 10:00', '2026-12-04 10:00')->confirmed()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/pick-up", ['payment_method' => 'bank_transfer', 'paid' => false])
            ->assertOk();

        $invoice = $reservation->refresh()->invoice;
        $this->assertSame('FAC-2026-000002', $invoice->number);
        $this->assertSame(InvoiceStatus::Unpaid, $invoice->status);
        $this->assertSame(PaymentMethod::BankTransfer, $invoice->payment_method);
        $this->assertNull($invoice->paid_at);
    }

    public function test_picking_up_requires_the_payment_method_and_whether_it_is_paid(): void
    {
        $reservation = Reservation::factory()->between('2026-12-01 10:00', '2026-12-04 10:00')->confirmed()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/pick-up", ['payment_method' => 'cheque'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'payment_method' => 'Le champ mode de paiement sélectionné est invalide.',
                'paid' => 'Le champ paiement est obligatoire.',
            ]);

        $this->assertSame(ReservationStatus::Confirmed, $reservation->refresh()->status);
        $this->assertDatabaseCount('invoices', 0);
    }

    public function test_an_invoice_created_before_the_pick_up_rule_is_updated_not_duplicated(): void
    {
        $reservation = Reservation::factory()->between('2026-12-01 10:00', '2026-12-04 10:00')->confirmed()->create();
        $existing = Invoice::factory()->for($reservation)->create(['issued_at' => '2026-11-25 10:00']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/pick-up", ['payment_method' => 'cash', 'paid' => true])
            ->assertOk()
            ->assertJsonPath('data.invoice.number', $existing->number);

        $this->assertDatabaseCount('invoices', 1);
        $this->assertSame(InvoiceStatus::Paid, $existing->refresh()->status);
    }

    public function test_lists_invoices_with_filters_and_the_totals_of_the_filtered_list(): void
    {
        $bennani = User::factory()->create(['name' => 'Salma Bennani']);
        $paid = Invoice::factory()->paid()->for(Reservation::factory()->for($bennani)->completed()->state(['total' => '1000.00']))->create(['issued_at' => '2026-11-10 10:00']);
        $unpaid = Invoice::factory()->for(Reservation::factory()->for($bennani)->active()->state(['total' => '450.50']))->create(['issued_at' => '2026-11-20 10:00', 'payment_method' => 'cash']);
        // A named customer: the factory's random Moroccan names can be "… Bennani" too.
        $other = User::factory()->create(['name' => 'Omar Tazi', 'email' => 'omar.tazi@example.com']);
        Invoice::factory()->paid()->for(Reservation::factory()->for($other)->completed()->state(['total' => '700.00']))->create(['issued_at' => '2026-10-05 10:00']);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/invoices?q=bennani')
            ->assertOk()
            ->assertJsonPath('data.*.number', [$unpaid->number, $paid->number])
            ->assertJsonPath('data.0.reservation.client.name', 'Salma Bennani')
            ->assertJsonPath('meta.totals', ['count' => 2, 'total' => '1450.50', 'paid' => '1000.00', 'unpaid' => '450.50']);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/invoices?status=unpaid')
            ->assertJsonPath('data.*.number', [$unpaid->number])
            ->assertJsonPath('meta.totals.unpaid', '450.50');

        $this->actingAs($this->admin)
            ->getJson('/api/admin/invoices?payment_method=card&from=2026-11-01&to=2026-11-30')
            ->assertJsonPath('data.*.number', [$paid->number])
            ->assertJsonPath('meta.totals.total', '1000.00');

        $this->actingAs($this->admin)
            ->getJson('/api/admin/invoices?sort=total_ttc&direction=asc')
            ->assertJsonPath('data.*.total_ttc', ['450.50', '700.00', '1000.00'])
            ->assertJsonPath('meta.totals', ['count' => 3, 'total' => '2150.50', 'paid' => '1700.00', 'unpaid' => '450.50']);
    }

    public function test_the_list_validates_its_filters(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/invoices?status=late&from=2026-12-10&to=2026-12-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status', 'to']);
    }

    public function test_marks_an_unpaid_invoice_as_paid(): void
    {
        $invoice = Invoice::factory()->create(['issued_at' => '2026-11-20 10:00', 'payment_method' => 'cash']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/invoices/{$invoice->number}/mark-paid", ['payment_method' => 'card'])
            ->assertOk()
            ->assertJsonPath('message', 'Facture marquée comme payée.')
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.payment_method', 'card');

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::Paid, $invoice->status);
        $this->assertSame(PaymentMethod::Card, $invoice->payment_method);
        $this->assertTrue($invoice->paid_at->equalTo(now()));
    }

    public function test_a_paid_invoice_cannot_be_marked_paid_again(): void
    {
        $invoice = Invoice::factory()->paid()->create(['issued_at' => '2026-11-20 10:00']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/invoices/{$invoice->number}/mark-paid", ['payment_method' => 'cash'])
            ->assertForbidden()
            ->assertExactJson(['message' => 'Cette facture est déjà payée.']);

        $this->assertSame(PaymentMethod::Card, $invoice->refresh()->payment_method);
    }

    public function test_marking_paid_requires_a_payment_method(): void
    {
        $invoice = Invoice::factory()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/invoices/{$invoice->number}/mark-paid")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['payment_method' => 'Le champ mode de paiement est obligatoire.']);
    }

    public function test_sends_the_invoice_to_the_client_again_by_email_only(): void
    {
        Notification::fake();
        $invoice = Invoice::factory()->paid()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/invoices/{$invoice->number}/send")
            ->assertOk()
            ->assertJsonPath('message', 'Facture envoyée au client.');

        Notification::assertSentToTimes($invoice->reservation->user, InvoiceIssued::class, 1);
        Notification::assertSentTo(
            $invoice->reservation->user,
            InvoiceIssued::class,
            fn (InvoiceIssued $notification, array $channels): bool => $channels === ['mail'] && $notification->resent,
        );
    }

    public function test_downloads_the_invoice_pdf(): void
    {
        $invoice = Invoice::factory()->create();

        $this->actingAs($this->admin)
            ->get("/api/admin/invoices/{$invoice->number}/pdf")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertDownload("facture-{$invoice->number}.pdf");
    }

    public function test_downloads_the_voucher_of_a_confirmed_reservation_only(): void
    {
        $confirmed = Reservation::factory()->confirmed()->create();
        $pending = Reservation::factory()->pending()->create();

        $this->actingAs($this->admin)
            ->get("/api/admin/reservations/{$confirmed->reference}/voucher")
            ->assertOk()
            ->assertDownload("bon-de-reservation-{$confirmed->reference}.pdf");

        $this->actingAs($this->admin)
            ->getJson("/api/admin/reservations/{$pending->reference}/voucher")
            ->assertNotFound();
    }

    public function test_clients_cannot_reach_the_invoices(): void
    {
        $invoice = Invoice::factory()->create();
        $client = $invoice->reservation->user;

        $this->actingAs($client)->getJson('/api/admin/invoices')->assertForbidden();
        $this->actingAs($client)->getJson("/api/admin/invoices/{$invoice->number}/pdf")->assertForbidden();
        $this->actingAs($client)->postJson("/api/admin/invoices/{$invoice->number}/mark-paid", ['payment_method' => 'cash'])->assertForbidden();
        $this->actingAs($client)->postJson("/api/admin/invoices/{$invoice->number}/send")->assertForbidden();

        $this->assertSame(InvoiceStatus::Unpaid, $invoice->refresh()->status);
    }
}
