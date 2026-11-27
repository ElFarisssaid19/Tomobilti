<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Car;
use App\Models\CarImage;
use App\Models\Category;
use App\Models\Extra;
use App\Models\Invoice;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\Agency\NewReservationRequest;
use Closure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * No N+1 queries on the list endpoints: the number of queries of a list must not grow
 * with the number of rows it returns.
 */
class QueryCountTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->admin = User::factory()->admin()->create();
    }

    /**
     * Runs `$request` with one row, then after `$add` created five more, and expects the
     * same number of queries both times.
     *
     * @param  Closure(): TestResponse  $request
     * @param  Closure(): void  $add  creates one more row
     */
    private function assertQueriesDoNotGrow(Closure $request, Closure $add): void
    {
        $count = function () use ($request): int {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $request()->assertOk();
            DB::disableQueryLog();

            return count(DB::getQueryLog());
        };

        $add();
        $withOne = $count();

        foreach (range(1, 5) as $ignored) {
            $add();
        }

        $this->assertSame($withOne, $count(), 'The number of queries grows with the number of rows.');
    }

    private function carWithPhoto(): Car
    {
        $car = Car::factory()->create();
        CarImage::factory()->primary()->for($car)->create();

        return $car;
    }

    public function test_admin_reservation_list(): void
    {
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/admin/reservations?tab=all'),
            fn () => Reservation::factory()->for($this->carWithPhoto())->create(),
        );
    }

    public function test_admin_car_list(): void
    {
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/admin/cars'),
            fn () => $this->carWithPhoto(),
        );
    }

    public function test_admin_client_list(): void
    {
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/admin/clients'),
            fn () => Reservation::factory()->completed()->create(),
        );
    }

    public function test_admin_client_detail_with_its_reservations(): void
    {
        $client = User::factory()->create();

        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson("/api/admin/clients/{$client->id}"),
            fn () => Reservation::factory()->for($client)->for($this->carWithPhoto())->completed()->create(),
        );
    }

    public function test_admin_invoice_list(): void
    {
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/admin/invoices'),
            fn () => Invoice::factory()->create(),
        );
    }

    public function test_admin_planning(): void
    {
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/admin/planning?from=2026-11-30&to=2026-12-13'),
            fn () => Reservation::factory()->for($this->carWithPhoto())->between('2026-12-02 10:00', '2026-12-04 10:00')->confirmed()->create(),
        );
    }

    public function test_admin_dashboard(): void
    {
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/admin/dashboard'),
            fn () => Reservation::factory()->for($this->carWithPhoto())->between('2026-12-01 10:00', '2026-12-03 10:00')->confirmed()->create(),
        );
    }

    public function test_admin_settings_lists(): void
    {
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/admin/categories'),
            fn () => Car::factory()->for(Category::factory())->create(),
        );
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/admin/brands'),
            fn () => Car::factory()->for(Brand::factory())->create(),
        );
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/admin/locations'),
            fn () => Car::factory()->for(Location::factory())->create(),
        );
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/admin/extras'),
            fn () => Extra::factory()->create(),
        );
    }

    public function test_my_reservations(): void
    {
        $client = User::factory()->create();

        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($client)->getJson('/api/reservations?tab=upcoming'),
            fn () => Reservation::factory()->for($client)->for($this->carWithPhoto())->confirmed()->create(),
        );
    }

    public function test_notifications(): void
    {
        $this->assertQueriesDoNotGrow(
            fn () => $this->actingAs($this->admin)->getJson('/api/notifications'),
            fn () => $this->admin->notifyNow(new NewReservationRequest(Reservation::factory()->create()), ['database']),
        );
    }

    public function test_public_reference_lists(): void
    {
        $this->assertQueriesDoNotGrow(
            fn () => $this->getJson('/api/cars/featured'),
            fn () => CarImage::factory()->primary()->for(Car::factory()->create(['is_featured' => true]))->create(),
        );
        $this->assertQueriesDoNotGrow(
            fn () => $this->getJson('/api/catalog/filters'),
            fn () => Car::factory()->create(),
        );
        $this->assertQueriesDoNotGrow(
            fn () => $this->getJson('/api/categories'),
            fn () => Car::factory()->for(Category::factory())->create(),
        );
        $this->assertQueriesDoNotGrow(
            fn () => $this->getJson('/api/locations'),
            fn () => Location::factory()->create(),
        );
    }
}
