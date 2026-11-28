<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CurrentUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_the_signed_in_user_without_secrets(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'client')
            ->assertJsonPath('data.role_label', 'Client')
            ->assertJsonPath('data.is_admin', false)
            ->assertJsonPath('data.cin', $user->cin)
            ->assertJsonPath('data.birth_date', $user->birth_date->toDateString())
            ->assertJsonPath('data.has_complete_profile', true)
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token')
            ->assertJsonMissingPath('data.is_active');
    }

    public function test_admin_flag_and_label_come_from_the_role(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/user')
            ->assertJsonPath('data.is_admin', true)
            ->assertJsonPath('data.role_label', 'Administrateur')
            ->assertJsonPath('data.has_complete_profile', false);
    }

    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_the_session_endpoint_returns_the_user_or_null_never_401(): void
    {
        $this->getJson('/api/auth/session')
            ->assertOk()
            ->assertExactJson(['data' => null]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/auth/session')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonMissingPath('data.password');
    }

    public function test_page_loads_do_not_use_up_the_limit_of_the_auth_forms(): void
    {
        foreach (range(1, 10) as $pageLoad) {
            $this->getJson('/api/auth/session')->assertOk();
        }

        $this->postJson('/api/auth/forgot-password', ['email' => 'personne@example.com'])->assertOk();
    }
}
