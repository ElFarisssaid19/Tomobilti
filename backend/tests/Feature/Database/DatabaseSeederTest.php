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
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
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
        $this->assertTrue(Hash::check(UserSeeder::DEMO_PASSWORD, $admin->password));
        $this->assertTrue(Hash::check(UserSeeder::DEMO_PASSWORD, $client->password));
        $this->assertTrue($client->reservations()->exists());
    }

    public function test_every_car_has_its_committed_photos_or_a_placeholder_on_the_public_disk(): void
    {
        $this->seedDemoData();

        $cars = Car::with(['images' => fn ($query) => $query->orderBy('sort_order')])->get();

        $this->assertGreaterThanOrEqual(30, $cars->count());
        $this->assertSame(2, $cars->where('status', CarStatus::Maintenance)->count());
        $this->assertTrue($cars->contains('is_featured', true));

        foreach ($cars as $car) {
            $manifests = File::glob(database_path(CarSeeder::PHOTO_ASSETS_DIRECTORY."/{$car->slug}/*.json"));
            $this->assertNotEmpty($car->images, "{$car->slug} has no image");
            $this->assertSame([true], $car->images->pluck('is_primary')->filter()->values()->all(), "{$car->slug} needs exactly one primary image");
            $this->assertTrue($car->images->first()->is_primary, "{$car->slug}: the first image is the primary one");

            if ($manifests === []) {
                $this->assertCount(1, $car->images);
                $this->assertStringStartsWith(CarSeeder::PLACEHOLDER_DIRECTORY.'/', $car->images->first()->path);
                Storage::disk('public')->assertExists($car->images->first()->path);

                continue;
            }

            $this->assertCount(count($manifests), $car->images, $car->slug);

            foreach ($car->images as $image) {
                $this->assertStringStartsWith(CarSeeder::PHOTO_DIRECTORY."/{$car->slug}/", $image->path);
                Storage::disk('public')->assertExists([$image->path, $image->thumbnailPath()]);
                $this->assertNotEmpty($image->author, $image->path);
                $this->assertNotEmpty($image->license, $image->path);
                $this->assertStringStartsWith('https://', $image->source_url);
                $this->assertStringStartsWith("{$car->brand->name} {$car->model} {$car->year}, ", $image->alt);
            }
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
                $reservation->pickup_location_id === $reservation->return_location_id ? '0.00' : '300.00',
                $reservation->one_way_fee,
                $reservation->reference,
            );
            $this->assertSame(
                bcadd(bcadd(bcmul($reservation->price_per_day, (string) $reservation->days, 2), $reservation->extras_total, 2), $reservation->one_way_fee, 2),
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

    public function test_invoices_are_issued_at_pick_up_for_every_active_and_completed_reservation(): void
    {
        $this->seedDemoData();

        $invoices = Invoice::with('reservation')->get();

        $this->assertSame(
            Reservation::withStatus(ReservationStatus::Active, ReservationStatus::Completed)->count(),
            $invoices->count(),
        );
        $this->assertTrue($invoices->contains('status', InvoiceStatus::Paid));
        $this->assertTrue($invoices->contains('status', InvoiceStatus::Unpaid));

        foreach ($invoices as $invoice) {
            $this->assertContains($invoice->reservation->status, [ReservationStatus::Active, ReservationStatus::Completed], $invoice->number);
            $this->assertTrue($invoice->issued_at->equalTo($invoice->reservation->picked_up_at), $invoice->number);
            $this->assertNotNull($invoice->payment_method, $invoice->number);
            $this->assertSame($invoice->status === InvoiceStatus::Paid, $invoice->paid_at !== null, $invoice->number);
            $this->assertSame($invoice->reservation->total, $invoice->total_ttc, $invoice->number);
            $this->assertMatchesRegularExpression('/^FAC-\d{4}-\d{6}$/', $invoice->number);
        }
    }
}
