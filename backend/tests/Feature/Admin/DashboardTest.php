<?php

namespace Tests\Feature\Admin;

use App\Models\Car;
use App\Models\Category;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Today is Tuesday 15 December 2026, 10:00, so the "30d" period is
 * [16 November 00:00, 16 December 00:00[ and the previous one [17 October, 16 November[.
 */
class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Car $economy;

    private Car $suv;

    private Car $inMaintenance;

    private Reservation $pendingTomorrow;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-15 10:00');
        $this->admin = User::factory()->admin()->create();

        $this->economy = Car::factory()->for(Category::factory()->create(['name' => 'Économique', 'sort_order' => 1]))->create(['price_per_day' => 300]);
        $this->suv = Car::factory()->for(Category::factory()->create(['name' => 'SUV', 'sort_order' => 2]))->create(['price_per_day' => 500]);
        $this->inMaintenance = Car::factory()->maintenance()->create();
        Car::factory()->outOfService()->create();

        // Returned on 4 December: 3 days × 300 = 900 DH of revenue in the period.
        Reservation::factory()->for($this->economy)->between('2026-12-01 10:00', '2026-12-04 10:00')->completed()->create(['created_at' => '2026-11-20 09:00']);
        // Returned on 5 November: 4 days × 500 = 2 000 DH, previous period only.
        Reservation::factory()->for($this->suv)->between('2026-11-01 10:00', '2026-11-05 10:00')->completed()->create(['created_at' => '2026-10-25 09:00']);
        // Expected revenue: confirmed 1 000 + active 900.
        Reservation::factory()->for($this->suv)->between('2026-12-20 10:00', '2026-12-22 10:00')->confirmed()->create(['created_at' => '2026-12-10 09:00']);
        Reservation::factory()->for($this->economy)->between('2026-12-14 10:00', '2026-12-17 10:00')->active()->create(['created_at' => '2026-12-01 09:00']);
        // Pending, picked up tomorrow 09:00 (within 48 hours): 2 days × 500 = 1 000.
        $this->pendingTomorrow = Reservation::factory()->for($this->suv)->between('2026-12-16 09:00', '2026-12-18 09:00')->pending()->create(['created_at' => '2026-12-14 09:00']);
        Reservation::factory()->for($this->economy)->between('2026-12-25 10:00', '2026-12-27 10:00')->cancelled()->create(['created_at' => '2026-12-02 09:00']);
        Reservation::factory()->for($this->suv)->between('2026-12-28 10:00', '2026-12-30 10:00')->rejected()->create(['created_at' => '2026-12-05 09:00']);
    }

    public function test_kpis_of_the_last_30_days(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/dashboard?period=30d')
            ->assertOk()
            ->assertJsonPath('data.period', ['key' => '30d', 'label' => '30 jours', 'from' => '2026-11-16', 'to' => '2026-12-15', 'days' => 30])
            ->assertJsonPath('data.kpis.revenue', '900.00')
            ->assertJsonPath('data.kpis.revenue_previous', '2000.00')
            ->assertJsonPath('data.kpis.expected_revenue', '1900.00')
            ->assertJsonPath('data.kpis.reservations', [
                'total' => 6,
                'by_status' => ['pending' => 1, 'confirmed' => 1, 'active' => 1, 'completed' => 1, 'cancelled' => 1, 'rejected' => 1],
            ])
            ->assertJsonPath('data.kpis.pending_requests', 1)
            ->assertJsonPath('data.kpis.active_rentals', 1);
    }

    public function test_utilisation_counts_booked_hours_inside_the_period_over_the_fleet_not_out_of_service(): void
    {
        // Completed: 3 days. Active from 14 Dec 10:00, clipped at 16 Dec 00:00: 38 h.
        // Fleet: 3 cars (the out of service one excluded) × 30 days = 90 car-days.
        $this->actingAs($this->admin)
            ->getJson('/api/admin/dashboard')
            ->assertJsonPath('data.kpis.utilisation', [
                'rate' => 5.1,
                'booked_days' => 4.6,
                'available_car_days' => 90,
                'cars' => 3,
            ]);
    }

    public function test_today_charts_and_alerts(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/admin/dashboard?period=30d')->assertOk();

        $response
            ->assertJsonPath('data.today.0.date', '2026-12-15')
            ->assertJsonCount(0, 'data.today.0.pickups')
            ->assertJsonPath('data.today.1.date', '2026-12-16')
            ->assertJsonPath('data.today.1.pickups.0.reference', $this->pendingTomorrow->reference)
            ->assertJsonPath('data.alerts.pending_soon.0.reference', $this->pendingTomorrow->reference)
            ->assertJsonCount(1, 'data.alerts.pending_soon')
            ->assertJsonCount(2, 'data.alerts.cars_unavailable')
            ->assertJsonPath('data.alerts.cars_unavailable.0.id', $this->inMaintenance->id)
            ->assertJsonCount(1, 'data.charts.top_cars')
            ->assertJsonPath('data.charts.top_cars.0.car.id', $this->economy->id)
            ->assertJsonPath('data.charts.top_cars.0.revenue', '900.00')
            ->assertJsonPath('data.charts.by_category', [
                ['id' => $this->suv->category_id, 'name' => 'SUV', 'reservations' => 2, 'amount' => '2000.00'],
                ['id' => $this->economy->category_id, 'name' => 'Économique', 'reservations' => 2, 'amount' => '1800.00'],
            ])
            ->assertJsonCount(6, 'data.recent');

        $months = collect($response->json('data.charts.revenue_by_month'));
        $this->assertCount(12, $months);
        $this->assertSame('2026-01', $months->first()['month']);
        $this->assertSame(['month' => '2026-11', 'revenue' => '2000.00', 'reservations' => 1], $months->firstWhere('month', '2026-11'));
        $this->assertSame(['month' => '2026-12', 'revenue' => '900.00', 'reservations' => 1], $months->last());

        $weeks = collect($response->json('data.charts.reservations_by_week'));
        $this->assertSame('2026-11-16', $weeks->first()['week']);
        $this->assertSame(6, $weeks->sum('reservations'));
    }

    public function test_a_longer_period_includes_older_revenue(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/dashboard?period=90d')
            ->assertJsonPath('data.period.from', '2026-09-17')
            ->assertJsonPath('data.kpis.revenue', '2900.00')
            ->assertJsonPath('data.kpis.reservations.total', 7);
    }

    public function test_unknown_period_is_refused(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/dashboard?period=7d')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('period');
    }
}
