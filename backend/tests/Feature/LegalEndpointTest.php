<?php

namespace Tests\Feature;

use App\Enums\CarStatus;
use App\Models\Car;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegalEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_serves_the_rules_of_the_config_and_the_deposit_range_of_the_public_fleet(): void
    {
        config([
            'tomobilti.booking.min_age' => 23,
            'tomobilti.booking.free_cancellation_hours' => 48,
            'tomobilti.rental.km_per_day' => 250,
            'tomobilti.privacy.retention_years.account' => 5,
            'tomobilti.company.name' => 'Agence Test SARL',
        ]);
        Car::factory()->create(['deposit_amount' => '5000.00']);
        Car::factory()->create(['deposit_amount' => '12000.00']);
        Car::factory()->create(['deposit_amount' => '90000.00', 'status' => CarStatus::Maintenance]);

        $this->getJson('/api/legal')
            ->assertOk()
            ->assertJsonPath('data.booking.min_age', 23)
            ->assertJsonPath('data.booking.free_cancellation_hours', 48)
            ->assertJsonPath('data.booking.one_way_fee', '300.00')
            ->assertJsonPath('data.rental.km_per_day', 250)
            ->assertJsonPath('data.rental.deposit_min', '5000.00')
            ->assertJsonPath('data.rental.deposit_max', '12000.00')
            ->assertJsonPath('data.rental.documents.0.label', 'CIN ou passeport')
            ->assertJsonPath('data.privacy.retention_years.account', 5)
            ->assertJsonPath('data.company.name', 'Agence Test SARL');
    }
}
