<?php

namespace Tests\Feature\Reservation;

use Tests\TestCase;

class BookingRulesTest extends TestCase
{
    public function test_shares_the_booking_rules_with_the_spa(): void
    {
        $this->getJson('/api/booking-rules')
            ->assertOk()
            ->assertExactJson(['data' => [
                'opening_time' => '08:00',
                'closing_time' => '20:00',
                'slot_minutes' => 30,
                'min_lead_hours' => 2,
                'max_advance_months' => 6,
                'min_days' => 1,
                'max_days' => 30,
                'min_age' => 21,
                'min_license_years' => 2,
                'free_cancellation_hours' => 24,
                'one_way_fee' => '300.00',
            ]]);
    }
}
