<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_logout_ends_the_session(): void
    {
        User::factory()->create(['email' => 'client@example.com']);
        $this->fromSpa()->postJson('/api/auth/login', ['email' => 'client@example.com', 'password' => 'password']);

        $this->fromSpa()
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Vous êtes déconnecté.');

        $this->assertGuest('web');
    }

    public function test_guest_cannot_log_out_and_gets_401(): void
    {
        $this->fromSpa()->postJson('/api/auth/logout')->assertUnauthorized();
    }
}
