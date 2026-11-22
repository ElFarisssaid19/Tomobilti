<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\Auth\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_link_email_points_to_the_spa(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'client@example.com']);

        $this->fromSpa()
            ->postJson('/api/auth/forgot-password', ['email' => 'client@example.com'])
            ->assertOk()
            ->assertJsonPath('message', __('api.auth.reset_link_sent'));

        Notification::assertSentTo($user, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) use ($user): bool {
            $mail = $notification->toMail($user);

            return $mail->subject === 'Réinitialisez votre mot de passe'
                && $mail->actionUrl === 'http://localhost:5173/reinitialiser-mot-de-passe?token='.$notification->token.'&email=client%40example.com';
        });
    }

    public function test_unknown_email_gets_the_same_answer_and_no_email(): void
    {
        Notification::fake();

        $this->fromSpa()
            ->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertOk()
            ->assertJsonPath('message', __('api.auth.reset_link_sent'));

        Notification::assertNothingSent();
    }

    public function test_valid_token_sets_the_new_password(): void
    {
        $user = User::factory()->create(['email' => 'client@example.com']);
        $token = Password::createToken($user);

        $this->fromSpa()
            ->postJson('/api/auth/reset-password', [
                'token' => $token,
                'email' => 'client@example.com',
                'password' => 'nouveau2026',
                'password_confirmation' => 'nouveau2026',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Votre mot de passe a été réinitialisé !');

        $this->assertTrue(Hash::check('nouveau2026', $user->fresh()->password));
    }

    public function test_invalid_token_returns_422(): void
    {
        $user = User::factory()->create(['email' => 'client@example.com']);

        $this->fromSpa()
            ->postJson('/api/auth/reset-password', [
                'token' => 'not-a-real-token',
                'email' => 'client@example.com',
                'password' => 'nouveau2026',
                'password_confirmation' => 'nouveau2026',
            ])
            ->assertInvalid(['email' => 'Ce jeton de réinitialisation du mot de passe n\'est pas valide.']);

        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_unknown_email_on_reset_gets_the_invalid_link_message(): void
    {
        $this->fromSpa()
            ->postJson('/api/auth/reset-password', [
                'token' => 'whatever',
                'email' => 'nobody@example.com',
                'password' => 'nouveau2026',
                'password_confirmation' => 'nouveau2026',
            ])
            ->assertInvalid(['email' => 'Ce jeton de réinitialisation du mot de passe n\'est pas valide.']);
    }

    public function test_forgot_password_is_throttled_after_six_requests(): void
    {
        Notification::fake();

        for ($request = 1; $request <= 6; $request++) {
            $this->fromSpa()->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk();
        }

        $this->fromSpa()
            ->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertTooManyRequests()
            ->assertJsonPath('message', 'Trop de requêtes. Veuillez réessayer dans quelques instants.');
    }
}
