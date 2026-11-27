<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_credentials_log_the_user_in(): void
    {
        $user = User::factory()->create(['email' => 'client@example.com']);

        $this->fromSpa()
            ->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('message', 'Connexion réussie.')
            ->assertJsonMissingPath('data.password');

        $this->assertAuthenticatedAs($user);
    }

    public function test_remember_me_sets_the_remember_cookie(): void
    {
        User::factory()->create(['email' => 'client@example.com']);

        $this->fromSpa()
            ->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'password', 'remember' => true])
            ->assertOk()
            ->assertCookie(Auth::guard('web')->getRecallerName());
    }

    public function test_wrong_password_returns_422_and_stays_logged_out(): void
    {
        User::factory()->create(['email' => 'client@example.com']);

        $this->fromSpa()
            ->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'wrong-password'])
            ->assertUnprocessable()
            ->assertInvalid(['email' => 'Ces identifiants ne correspondent pas à nos enregistrements.']);

        $this->assertGuest();
    }

    public function test_inactive_account_returns_403_with_a_clear_message(): void
    {
        User::factory()->inactive()->create(['email' => 'client@example.com']);

        $this->fromSpa()
            ->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'password'])
            ->assertForbidden()
            ->assertJsonPath('message', 'Votre compte est désactivé. Contactez l’agence pour le réactiver.');

        $this->assertGuest();
    }

    public function test_inactive_account_with_a_wrong_password_gets_the_generic_error(): void
    {
        User::factory()->inactive()->create(['email' => 'client@example.com']);

        $this->fromSpa()
            ->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'wrong-password'])
            ->assertUnprocessable()
            ->assertInvalid(['email' => 'Ces identifiants ne correspondent pas']);
    }

    public function test_sixth_attempt_within_a_minute_returns_429_with_the_wait_time(): void
    {
        User::factory()->create(['email' => 'client@example.com']);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->fromSpa()
                ->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'wrong-password'])
                ->assertUnprocessable();
        }

        $response = $this->fromSpa()
            ->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'password']);

        $response->assertTooManyRequests();
        $this->assertMatchesRegularExpression(
            '/^Tentatives de connexion trop nombreuses\. Veuillez essayer de nouveau dans \d+ secondes\.$/',
            $response->json('message'),
        );
        $this->assertGuest();
    }

    public function test_one_address_cannot_try_many_accounts(): void
    {
        for ($attempt = 1; $attempt <= 20; $attempt++) {
            $this->fromSpa()
                ->postJson('/api/auth/login', ['email' => "client{$attempt}@example.com", 'password' => 'wrong-password'])
                ->assertUnprocessable();
        }

        $this->fromSpa()
            ->postJson('/api/auth/login', ['email' => 'client21@example.com', 'password' => 'wrong-password'])
            ->assertTooManyRequests();
    }

    public function test_successful_login_resets_the_failed_attempts(): void
    {
        User::factory()->create(['email' => 'client@example.com']);

        for ($attempt = 1; $attempt <= 4; $attempt++) {
            $this->fromSpa()->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'wrong-password']);
        }
        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'password'])->assertOk();
        $this->fromSpa()->postJson('/api/auth/logout')->assertOk();

        $this->fromSpa()
            ->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'wrong-password'])
            ->assertUnprocessable();
    }

    public function test_missing_fields_return_422(): void
    {
        $this->fromSpa()
            ->postJson('/api/auth/login', [])
            ->assertInvalid(['email', 'password']);
    }
}
