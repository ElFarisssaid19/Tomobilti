<?php

namespace Tests\Feature\Database;

use App\Enums\CarStatus;
use App\Enums\InvoiceStatus;
use App\Enums\ReservationStatus;
use App\Enums\UserRole;
use App\Models\Car;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\User;
use Database\Seeders\CarSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Seed the whole demo dataset once per test.
     */
    private function seedDemoData(): void
    {
        Storage::fake('public');
        $this->seed();
    }

    public function test_seeds_the_reference_data_and_demo_accounts(): void
    {
        $this->seedDemoData();

        $this->assertDatabaseCount('categories', 7);
        $this->assertDatabaseCount('brands', 14);
        $this->assertDatabaseCount('locations', 5);
        $this->assertDatabaseCount('extras', 6);
        $this->assertSame(1, User::where('role', UserRole::Admin)->count());
        $this->assertSame(1 + 25, User::where('role', UserRole::Client)->count(), 'demo client + 25 customers');

        $admin = User::where('email', 'admin@tomobilti.ma')->sole();
        $client = User::where('email', 'client@tomobilti.ma')->sole();
        $this->assertTrue($admin->isAdmin());
        $this->assertTrue($client->isClient());
        $this->assertTrue(Hash::check('password', $admin->password));
        $this->assertTrue(Hash::check('password', $client->password));
        $this->assertTrue($client->reservations()->exists());
    }

    public function test_every_car_has_a_placeholder_image_on_the_public_disk(): void
    {
        $this->seedDemoData();

        $cars = Car::with('primaryImage')->get();

        $this->assertGreaterThanOrEqual(30, $cars->count());
        $this->assertSame(2, $cars->where('status', CarStatus::Maintenance)->count());
        $this->assertTrue($cars->contains('is_featured', true));

        foreach ($cars as $car) {
            $this->assertNotNull($car->primaryImage, "{$car->slug} has no image");
            $this->assertStringStartsWith(CarSeeder::PLACEHOLDER_DIRECTORY.'/', $car->primaryImage->path);
            Storage::disk('public')->assertExists($car->primaryImage->path);
        }
    }

    public function test_reservations_cover_every_status_with_consistent_totals(): void
    {
        $this->seedDemoData();

        $reservations = Reservation::with('extras')->get();

        $this->assertGreaterThanOrEqual(55, $reservations->count());
        $this->assertEqualsCanonicalizing(
            ReservationStatus::values(),
            $reservations->pluck('status')->map->value->unique()->values()->all(),
        );
        $this->assertTrue(Reservation::past()->exists());
        $this->assertTrue(Reservation::current()->exists());
        $this->assertTrue(Reservation::upcoming()->exists());

        foreach ($reservations as $reservation) {
            $extrasTotal = $reservation->extras->reduce(
                fn (string $sum, $extra): string => bcadd($sum, $extra->pivot->total, 2),
                '0.00',
            );

            $this->assertSame($extrasTotal, $reservation->extras_total, $reservation->reference);
            $this->assertSame(
                bcadd(bcmul($reservation->price_per_day, (string) $reservation->days, 2), $reservation->extras_total, 2),
                $reservation->total,
                $reservation->reference,
            );
        }
    }

    public function test_no_car_has_overlapping_blocking_reservations(): void
    {
        $this->seedDemoData();

        $blocking = Reservation::blocking()->orderBy('start_at')->get()->groupBy('car_id');

        foreach ($blocking as $carReservations) {
            foreach ($carReservations as $reservation) {
                $this->assertFalse(
                    $reservation->car->isAvailableBetween($reservation->start_at, $reservation->end_at),
                    "{$reservation->reference} should block its own period",
                );
                $this->assertTrue(
                    $reservation->car->reservations()
                        ->blocking()
                        ->overlapping($reservation->start_at, $reservation->end_at)
                        ->whereKeyNot($reservation->id)
                        ->doesntExist(),
                    "{$reservation->reference} overlaps another blocking reservation",
                );
            }
        }
    }

    public function test_invoices_exist_for_completed_and_some_confirmed_reservations(): void
    {
        $this->seedDemoData();

        $invoices = Invoice::with('reservation')->get();

        $this->assertSame(
            Reservation::withStatus(ReservationStatus::Completed)->count(),
            $invoices->where('status', InvoiceStatus::Paid)->count(),
        );
        $this->assertTrue($invoices->contains('status', InvoiceStatus::Unpaid));

        foreach ($invoices as $invoice) {
            $expectedStatus = match ($invoice->reservation->status) {
                ReservationStatus::Completed => InvoiceStatus::Paid,
                ReservationStatus::Confirmed => InvoiceStatus::Unpaid,
            };

            $this->assertSame($expectedStatus, $invoice->status, $invoice->number);
            $this->assertSame($invoice->reservation->total, $invoice->total_ttc, $invoice->number);
            $this->assertMatchesRegularExpression('/^FAC-\d{4}-\d{6}$/', $invoice->number);
        }
    }
}
