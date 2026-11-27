<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_is_changed_with_the_current_one(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'nouveau2026',
                'password_confirmation' => 'nouveau2026',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Mot de passe modifié.');

        $this->assertTrue(Hash::check('nouveau2026', $user->fresh()->password));
    }

    public function test_wrong_current_password_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'not-my-password',
                'password' => 'nouveau2026',
                'password_confirmation' => 'nouveau2026',
            ])
            ->assertInvalid(['current_password' => 'Le mot de passe est incorrect.']);

        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_new_password_must_differ_and_follow_the_rules(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'password',
                'password_confirmation' => 'password',
            ])
            ->assertInvalid(['password']);

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'court1',
                'password_confirmation' => 'court1',
            ])
            ->assertInvalid(['password']);
    }

    public function test_guest_gets_401(): void
    {
        $this->putJson('/api/profile/password', [])->assertUnauthorized();
    }

    public function test_guessing_the_current_password_is_limited_to_six_tries_per_minute(): void
    {
        $user = User::factory()->create();
        $guess = [
            'current_password' => 'not-my-password',
            'password' => 'nouveau2026',
            'password_confirmation' => 'nouveau2026',
        ];

        foreach (range(1, 6) as $attempt) {
            $this->actingAs($user)->putJson('/api/profile/password', $guess)->assertUnprocessable();
        }

        $this->actingAs($user)->putJson('/api/profile/password', $guess)
            ->assertTooManyRequests()
            ->assertJsonPath('message', 'Trop de requêtes. Veuillez réessayer dans quelques instants.');
    }
}
