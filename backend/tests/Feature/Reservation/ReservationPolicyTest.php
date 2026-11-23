<?php

namespace Tests\Feature\Reservation;

use App\Models\Reservation;
use App\Models\User;
use App\Policies\ReservationPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ReservationPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
    }

    public function test_customers_only_see_their_own_reservations_and_others_look_missing(): void
    {
        $owner = User::factory()->create();
        $reservation = Reservation::factory()->for($owner)->create();
        $policy = new ReservationPolicy;

        $this->assertTrue($policy->viewAny(User::factory()->create()));
        $this->assertTrue($policy->view($owner, $reservation)->allowed());

        $stranger = $policy->view(User::factory()->create(), $reservation);
        $this->assertTrue($stranger->denied());
        $this->assertSame(404, $stranger->status());
    }

    public function test_disabled_accounts_cannot_book(): void
    {
        $policy = new ReservationPolicy;

        $this->assertTrue($policy->create(User::factory()->create())->allowed());
        $this->assertSame(
            'Votre compte est désactivé. Contactez l’agence pour le réactiver.',
            $policy->create(User::factory()->inactive()->create())->message(),
        );
    }

    /**
     * @return array<string, array{string, string, bool}>
     */
    public static function cancellations(): array
    {
        return [
            'pending, 3 days ahead' => ['pending', '2026-12-04 09:00', true],
            'confirmed, 24 h 30 min ahead' => ['confirmed', '2026-12-02 09:30', true],
            'confirmed, exactly 24 h ahead' => ['confirmed', '2026-12-02 09:00', false],
            'confirmed, 2 hours ahead' => ['confirmed', '2026-12-01 11:00', false],
            'active' => ['active', '2026-12-04 09:00', false],
            'completed' => ['completed', '2026-12-04 09:00', false],
            'cancelled' => ['cancelled', '2026-12-04 09:00', false],
            'rejected' => ['rejected', '2026-12-04 09:00', false],
        ];
    }

    #[DataProvider('cancellations')]
    public function test_free_cancellation_depends_on_the_status_and_the_24_hour_deadline(string $state, string $start, bool $allowed): void
    {
        $owner = User::factory()->create();
        $reservation = Reservation::factory()->for($owner)->between($start, '2026-12-08 10:00')->{$state}()->create();

        $this->assertSame($allowed, (new ReservationPolicy)->cancel($owner, $reservation)->allowed());
    }

    public function test_nobody_cancels_someone_elses_reservation(): void
    {
        $reservation = Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $response = (new ReservationPolicy)->cancel(User::factory()->create(), $reservation);

        $this->assertTrue($response->denied());
        $this->assertSame(404, $response->status());
    }
}
