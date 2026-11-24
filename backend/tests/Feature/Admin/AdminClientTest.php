<?php

namespace Tests\Feature\Admin;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminClientTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->admin = User::factory()->admin()->create(['name' => 'Admin Tomobilti']);
    }

    public function test_lists_clients_with_reservation_count_and_total_spent(): void
    {
        $salma = User::factory()->create(['name' => 'Salma Bennani', 'email' => 'salma@example.com']);
        Reservation::factory()->for($salma)->between('2026-11-01 10:00', '2026-11-03 10:00')->completed()->create(['total' => '600.00']);
        Reservation::factory()->for($salma)->between('2026-11-10 10:00', '2026-11-12 10:00')->completed()->create(['total' => '450.50']);
        Reservation::factory()->for($salma)->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()->create(['total' => '900.00']);
        User::factory()->inactive()->unverified()->create(['name' => 'Omar Tazi']);

        $this->actingAs($this->admin)->getJson('/api/admin/clients?sort=reservations_sum_total&direction=desc')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.name', 'Salma Bennani')
            ->assertJsonPath('data.0.reservations_count', 3)
            ->assertJsonPath('data.0.total_spent', '1050.50')
            ->assertJsonPath('data.1.total_spent', '0.00')
            ->assertJsonMissingPath('data.0.password');

        $this->actingAs($this->admin)->getJson('/api/admin/clients?q=salma@')->assertJsonPath('meta.total', 1);
        $this->actingAs($this->admin)->getJson('/api/admin/clients?active=0')->assertJsonPath('data.0.name', 'Omar Tazi');
        $this->actingAs($this->admin)->getJson('/api/admin/clients?verified=1')->assertJsonPath('meta.total', 1);
    }

    public function test_detail_has_the_history_and_totals(): void
    {
        $client = User::factory()->create();
        Reservation::factory()->for($client)->between('2026-11-01 10:00', '2026-11-03 10:00')->completed()->create(['total' => '600.00']);
        $upcoming = Reservation::factory()->for($client)->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->actingAs($this->admin)->getJson("/api/admin/clients/{$client->id}")
            ->assertOk()
            ->assertJsonPath('data.total_spent', '600.00')
            ->assertJsonPath('data.reservations_count', 2)
            ->assertJsonPath('data.stats.by_status.completed', 1)
            ->assertJsonPath('data.stats.upcoming', 1)
            ->assertJsonPath('data.reservations.0.reference', $upcoming->reference);

        $this->actingAs($this->admin)->getJson("/api/admin/clients/{$this->admin->id}")->assertNotFound();
    }

    public function test_deactivating_ends_the_clients_sessions_and_remember_token(): void
    {
        config(['session.driver' => 'database']);
        $client = User::factory()->create(['email' => 'client@example.com', 'password' => 'Tomobilti2026!']);
        $rememberToken = $client->remember_token;

        $login = $this->fromSpa()->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'Tomobilti2026!'])->assertOk();
        $sessionId = $login->getCookie(config('session.cookie'))->getValue();
        $this->assertDatabaseHas('sessions', ['user_id' => $client->id]);

        $this->freshRequest();
        $this->fromSpa()->withCredentials()->withCookie(config('session.cookie'), $sessionId)->getJson('/api/user')->assertOk();

        $this->freshRequest();
        $this->actingAs($this->admin)
            ->postJson("/api/admin/clients/{$client->id}/deactivate")
            ->assertOk()
            ->assertJsonPath('message', 'Compte désactivé. Le client a été déconnecté.')
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseMissing('sessions', ['user_id' => $client->id]);
        $this->assertNotSame($rememberToken, $client->refresh()->remember_token);
        $this->assertFalse($client->is_active);

        $this->freshRequest();
        $this->fromSpa()->withCredentials()->withCookie(config('session.cookie'), $sessionId)->getJson('/api/user')->assertUnauthorized();

        $this->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'Tomobilti2026!'])
            ->assertForbidden()
            ->assertJsonPath('errors.email.0', 'Votre compte est désactivé. Contactez l’agence pour le réactiver.');
    }

    /**
     * Start the next request like a new HTTP request from another browser: no headers
     * or cookies left from the previous one, and no user or session kept in memory by
     * the test application.
     */
    private function freshRequest(): void
    {
        $this->flushHeaders();
        $this->defaultCookies = [];
        $this->app['auth']->forgetGuards();
        $this->app['session']->forgetDrivers();
        $this->app->forgetInstance('session.store');
    }

    public function test_an_admin_cannot_deactivate_themselves_or_another_admin(): void
    {
        $otherAdmin = User::factory()->admin()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/clients/{$this->admin->id}/deactivate")
            ->assertForbidden()
            ->assertExactJson(['message' => 'Vous ne pouvez pas désactiver votre propre compte.']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/clients/{$otherAdmin->id}/deactivate")
            ->assertForbidden()
            ->assertExactJson(['message' => 'Un compte administrateur ne peut pas être désactivé depuis cet écran.']);

        $this->assertTrue($this->admin->refresh()->is_active);
        $this->assertTrue($otherAdmin->refresh()->is_active);
    }

    public function test_reactivates_a_client(): void
    {
        $client = User::factory()->inactive()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/clients/{$client->id}/activate")
            ->assertOk()
            ->assertJsonPath('message', 'Compte réactivé.')
            ->assertJsonPath('data.is_active', true);

        $this->assertTrue($client->refresh()->is_active);
    }
}
