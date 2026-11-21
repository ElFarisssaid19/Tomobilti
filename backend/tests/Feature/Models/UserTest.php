<?php

namespace Tests\Feature\Models;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_helpers_reflect_the_role(): void
    {
        $admin = User::factory()->admin()->create();
        $client = User::factory()->create();

        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isClient());
        $this->assertTrue($client->isClient());
        $this->assertFalse($client->isAdmin());
    }

    public function test_new_users_are_active_clients_by_default(): void
    {
        $user = new User;

        $this->assertSame(UserRole::Client, $user->role);
        $this->assertTrue($user->is_active);
    }

    public function test_role_and_active_flag_are_not_mass_assignable(): void
    {
        $user = User::create([
            'name' => 'Omar Tazi',
            'email' => 'omar@example.com',
            'password' => 'secret-password',
            'role' => 'admin',
            'is_active' => false,
        ])->fresh();

        $this->assertSame(UserRole::Client, $user->role);
        $this->assertTrue($user->is_active);
    }

    public function test_age_is_computed_from_the_birth_date(): void
    {
        $this->travelTo('2026-06-15 10:00:00');

        $this->assertSame(30, User::factory()->make(['birth_date' => '1996-06-15'])->age);
        $this->assertSame(29, User::factory()->make(['birth_date' => '1996-06-16'])->age);
        $this->assertNull(User::factory()->make(['birth_date' => null])->age);
    }

    public function test_licence_is_valid_after_two_full_years(): void
    {
        $this->travelTo('2026-06-15 10:00:00');

        $this->assertTrue(User::factory()->make(['driving_license_issued_at' => '2024-06-15'])->hasValidLicense());
        $this->assertFalse(User::factory()->make(['driving_license_issued_at' => '2024-06-16'])->hasValidLicense());
    }

    public function test_licence_validity_can_be_checked_on_the_pick_up_date(): void
    {
        $this->travelTo('2026-06-15 10:00:00');
        $user = User::factory()->make(['driving_license_issued_at' => '2024-07-01']);

        $this->assertFalse($user->hasValidLicense());
        $this->assertTrue($user->hasValidLicense(now()->setDate(2026, 7, 1)));
    }

    public function test_users_without_a_licence_are_not_valid_drivers(): void
    {
        $this->assertFalse(User::factory()->withoutLicense()->make()->hasValidLicense());
    }
}
