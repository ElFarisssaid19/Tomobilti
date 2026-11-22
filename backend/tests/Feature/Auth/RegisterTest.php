<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use App\Notifications\Auth\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Salma Bennani',
            'email' => 'salma@example.com',
            'phone' => '06 61 23 45 67',
            'password' => 'route2026',
            'password_confirmation' => 'route2026',
            'terms' => true,
            ...$overrides,
        ];
    }

    public function test_valid_registration_creates_a_logged_in_client_and_returns_201(): void
    {
        Notification::fake();

        $response = $this->fromSpa()->postJson('/api/auth/register', $this->payload());

        $response
            ->assertCreated()
            ->assertJsonPath('data.email', 'salma@example.com')
            ->assertJsonPath('data.role', 'client')
            ->assertJsonPath('data.is_admin', false)
            ->assertJsonPath('data.email_verified_at', null)
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token');

        $user = User::where('email', 'salma@example.com')->sole();
        $this->assertSame('+212661234567', $user->phone);
        $this->assertAuthenticatedAs($user);
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_role_sent_by_the_client_is_ignored(): void
    {
        Notification::fake();

        $this->fromSpa()
            ->postJson('/api/auth/register', $this->payload(['role' => 'admin', 'is_active' => false]))
            ->assertCreated()
            ->assertJsonPath('data.role', 'client');

        $user = User::where('email', 'salma@example.com')->sole();
        $this->assertSame(UserRole::Client, $user->role);
        $this->assertTrue($user->is_active);
    }

    public function test_empty_payload_returns_422_with_every_required_field(): void
    {
        $this->fromSpa()
            ->postJson('/api/auth/register', [])
            ->assertUnprocessable()
            ->assertInvalid(['name', 'email', 'phone', 'password', 'terms']);
    }

    public function test_existing_email_is_rejected(): void
    {
        User::factory()->create(['email' => 'salma@example.com']);

        $this->fromSpa()
            ->postJson('/api/auth/register', $this->payload(['email' => 'Salma@Example.com']))
            ->assertInvalid(['email' => 'Un compte existe déjà avec cette adresse e-mail.']);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidPhones(): array
    {
        return [
            'too short' => ['0612345'],
            'foreign number' => ['+33612345678'],
            'not a mobile or landline prefix' => ['0812345678'],
        ];
    }

    #[DataProvider('invalidPhones')]
    public function test_non_moroccan_phone_numbers_are_rejected(string $phone): void
    {
        $this->fromSpa()
            ->postJson('/api/auth/register', $this->payload(['phone' => $phone]))
            ->assertInvalid(['phone' => 'Saisissez un numéro marocain valide']);
    }

    public function test_password_needs_letters_numbers_and_a_matching_confirmation(): void
    {
        $this->fromSpa()
            ->postJson('/api/auth/register', $this->payload(['password' => 'abcdefgh', 'password_confirmation' => 'abcdefgh']))
            ->assertInvalid(['password' => 'au moins un chiffre']);

        $this->fromSpa()
            ->postJson('/api/auth/register', $this->payload(['password_confirmation' => 'other2026']))
            ->assertInvalid(['password']);
    }

    public function test_terms_must_be_accepted(): void
    {
        $this->fromSpa()
            ->postJson('/api/auth/register', $this->payload(['terms' => false]))
            ->assertInvalid(['terms' => 'Vous devez accepter les conditions générales de location.']);
    }
}
