<?php

namespace Tests\Feature\Reservation;

use App\Models\User;
use App\Services\BookingEligibility;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingEligibilityTest extends TestCase
{
    use RefreshDatabase;

    private CarbonImmutable $pickupAt;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->pickupAt = CarbonImmutable::parse('2026-12-10 10:00');
    }

    public function test_an_active_verified_customer_with_a_complete_profile_can_book(): void
    {
        $user = User::factory()->create(['birth_date' => '1990-05-01', 'driving_license_issued_at' => '2012-07-01']);

        $result = (new BookingEligibility)->check($user, $this->pickupAt);

        $this->assertSame(['eligible' => true, 'reasons' => [], 'missing_fields' => []], $result->toArray());
    }

    public function test_a_disabled_account_cannot_book(): void
    {
        $result = (new BookingEligibility)->check(User::factory()->inactive()->create(), $this->pickupAt);

        $this->assertFalse($result->isEligible());
        $this->assertSame(
            [['code' => 'account_inactive', 'message' => 'Votre compte est désactivé. Contactez l’agence pour le réactiver.']],
            $result->reasons,
        );
    }

    public function test_an_unverified_email_blocks_the_booking(): void
    {
        $result = (new BookingEligibility)->check(User::factory()->unverified()->create(), $this->pickupAt);

        $this->assertSame(
            [['code' => 'email_unverified', 'message' => 'Confirmez votre adresse e-mail avant de réserver une voiture.']],
            $result->reasons,
        );
    }

    public function test_an_incomplete_profile_lists_the_missing_fields(): void
    {
        $user = User::factory()->withoutLicense()->create(['phone' => null]);

        $result = (new BookingEligibility)->check($user, $this->pickupAt);

        $this->assertSame(['phone', 'driving_license_number', 'driving_license_issued_at'], $result->missingFields);
        $this->assertSame(
            [[
                'code' => 'profile_incomplete',
                'message' => 'Complétez votre profil pour réserver : téléphone, numéro de permis, date d’obtention du permis.',
            ]],
            $result->reasons,
        );
    }

    public function test_the_driver_must_be_21_on_the_pick_up_date(): void
    {
        $turns21AfterPickup = User::factory()->create(['birth_date' => '2005-12-11', 'driving_license_issued_at' => '2023-12-12']);
        $turns21OnPickupDay = User::factory()->create(['birth_date' => '2005-12-10', 'driving_license_issued_at' => '2023-12-10']);

        $refused = (new BookingEligibility)->check($turns21AfterPickup, $this->pickupAt);

        $this->assertSame(
            [['code' => 'under_age', 'message' => 'Vous devez avoir au moins 21 ans le jour de la prise en charge.']],
            $refused->reasons,
        );
        $this->assertTrue((new BookingEligibility)->check($turns21OnPickupDay, $this->pickupAt)->isEligible());
    }

    public function test_the_licence_must_be_two_years_old_on_the_pick_up_date(): void
    {
        $user = User::factory()->create(['birth_date' => '1995-01-01', 'driving_license_issued_at' => '2025-03-15']);

        $result = (new BookingEligibility)->check($user, $this->pickupAt);

        $this->assertSame(
            [[
                'code' => 'license_too_recent',
                'message' => 'Il faut au moins 2 ans de permis le jour de la prise en charge. Le vôtre les aura le 15 mars 2027.',
            ]],
            $result->reasons,
        );
        $this->assertTrue((new BookingEligibility)->check($user, CarbonImmutable::parse('2027-03-15 10:00'))->isEligible());
    }
}
