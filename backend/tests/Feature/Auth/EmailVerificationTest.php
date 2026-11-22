<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\Auth\VerifyEmailNotification;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function verificationPath(User $user, int $minutes = 60): string
    {
        $url = URL::temporarySignedRoute('auth.verification.verify', now()->addMinutes($minutes), [
            'id' => $user->id,
            'hash' => sha1($user->email),
        ]);

        return parse_url($url, PHP_URL_PATH).'?'.parse_url($url, PHP_URL_QUERY);
    }

    public function test_link_from_the_email_opens_the_spa_and_verifies_the_account(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $user->sendEmailVerificationNotification();

        $spaUrl = null;
        Notification::assertSentTo($user, VerifyEmailNotification::class, function (VerifyEmailNotification $notification) use ($user, &$spaUrl): bool {
            $spaUrl = $notification->toMail($user)->actionUrl;

            return true;
        });

        $this->assertStringStartsWith('http://localhost:5173/verifier-email?', $spaUrl);
        parse_str(parse_url($spaUrl, PHP_URL_QUERY), $params);

        // What the React page /verifier-email sends back to the API.
        $this->postJson("/api/auth/email/verify/{$params['id']}/{$params['hash']}?expires={$params['expires']}&signature={$params['signature']}")
            ->assertOk()
            ->assertJsonPath('status', 'verified');

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_valid_link_verifies_without_being_logged_in(): void
    {
        Event::fake([Verified::class]);
        $user = User::factory()->unverified()->create();

        $this->postJson($this->verificationPath($user))
            ->assertOk()
            ->assertJsonPath('message', 'Votre adresse e-mail est vérifiée.');

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        Event::assertDispatched(Verified::class);
    }

    public function test_already_verified_account_is_reported_as_such(): void
    {
        $user = User::factory()->create();

        $this->postJson($this->verificationPath($user))
            ->assertOk()
            ->assertJsonPath('status', 'already_verified');
    }

    public function test_tampered_signature_returns_403_invalid(): void
    {
        $user = User::factory()->unverified()->create();

        $this->postJson($this->verificationPath($user).'tampered')
            ->assertForbidden()
            ->assertJsonPath('status', 'invalid');

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_link_for_another_email_returns_403_invalid(): void
    {
        $user = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('auth.verification.verify', now()->addHour(), [
            'id' => $user->id,
            'hash' => sha1('old-address@example.com'),
        ]);

        $this->postJson($url)
            ->assertForbidden()
            ->assertJsonPath('status', 'invalid');
    }

    public function test_expired_link_returns_403_expired(): void
    {
        $user = User::factory()->unverified()->create();
        $path = $this->verificationPath($user, minutes: 60);

        $this->travel(61)->minutes();

        $this->postJson($path)
            ->assertForbidden()
            ->assertJsonPath('status', 'expired')
            ->assertJsonPath('message', 'Ce lien de vérification a expiré. Demandez-en un nouveau.');

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_resend_sends_a_new_email_to_unverified_users(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->postJson('/api/auth/email/verification-notification')
            ->assertOk()
            ->assertJsonPath('status', 'sent');

        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_resend_does_nothing_for_verified_users(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/auth/email/verification-notification')
            ->assertOk()
            ->assertJsonPath('status', 'already_verified');

        Notification::assertNothingSent();
    }

    public function test_resend_requires_authentication(): void
    {
        $this->postJson('/api/auth/email/verification-notification')->assertUnauthorized();
    }
}
