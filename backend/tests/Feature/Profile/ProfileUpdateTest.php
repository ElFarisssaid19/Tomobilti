<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use App\Notifications\Auth\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-11-22 10:00:00');
    }

    public function test_personal_information_is_saved(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile', [
                'name' => 'Omar Tazi',
                'phone' => '+212 7 00 11 22 33',
                'city' => 'Marrakech',
                'address' => '12, Avenue Mohammed V',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Profil enregistré.')
            ->assertJsonPath('data.phone', '+212700112233');

        $user->refresh();
        $this->assertSame('Omar Tazi', $user->name);
        $this->assertSame('Marrakech', $user->city);
    }

    public function test_licence_and_id_section_is_saved(): void
    {
        $user = User::factory()->withoutLicense()->create(['birth_date' => '1995-03-10', 'cin' => null]);

        $this->actingAs($user)
            ->putJson('/api/profile', [
                'cin' => 'be 123456',
                'driving_license_number' => '12/345678',
                'driving_license_issued_at' => '2015-06-01',
            ])
            ->assertOk()
            ->assertJsonPath('data.cin', 'BE123456')
            ->assertJsonPath('data.driving_license_issued_at', '2015-06-01')
            ->assertJsonPath('data.has_complete_profile', true);
    }

    public function test_customers_under_18_are_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile', ['birth_date' => '2008-11-23'])
            ->assertInvalid(['birth_date' => 'Vous devez avoir au moins 18 ans.']);

        $this->actingAs($user)
            ->putJson('/api/profile', ['birth_date' => '2008-11-22'])
            ->assertOk();
    }

    public function test_licence_date_cannot_be_in_the_future(): void
    {
        $this->actingAs(User::factory()->create())
            ->putJson('/api/profile', ['driving_license_issued_at' => '2026-11-23'])
            ->assertInvalid(['driving_license_issued_at' => 'La date d’obtention du permis ne peut pas être dans le futur.']);
    }

    public function test_licence_date_must_follow_the_18th_birthday_from_the_saved_profile(): void
    {
        $user = User::factory()->create(['birth_date' => '2000-05-10']);

        $this->actingAs($user)
            ->putJson('/api/profile', ['driving_license_issued_at' => '2018-05-09'])
            ->assertInvalid(['driving_license_issued_at' => 'Le permis ne peut pas avoir été obtenu avant vos 18 ans.']);

        $this->actingAs($user)
            ->putJson('/api/profile', ['driving_license_issued_at' => '2018-05-10'])
            ->assertOk();
    }

    public function test_licence_date_is_checked_against_the_birth_date_sent_with_it(): void
    {
        $user = User::factory()->create(['birth_date' => '1980-01-01']);

        $this->actingAs($user)
            ->putJson('/api/profile', ['birth_date' => '2000-05-10', 'driving_license_issued_at' => '2010-01-01'])
            ->assertInvalid(['driving_license_issued_at']);
    }

    public function test_cin_must_be_valid_and_unique(): void
    {
        User::factory()->create(['cin' => 'AB123456']);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile', ['cin' => '12AB'])
            ->assertInvalid(['cin' => 'Saisissez un numéro de CIN valide']);

        $this->actingAs($user)
            ->putJson('/api/profile', ['cin' => 'ab123456'])
            ->assertInvalid(['cin' => 'Ce numéro de CIN est déjà utilisé par un autre compte.']);
    }

    public function test_name_and_phone_cannot_be_emptied(): void
    {
        $this->actingAs(User::factory()->create())
            ->putJson('/api/profile', ['name' => '', 'phone' => ''])
            ->assertInvalid(['name', 'phone']);
    }

    public function test_changing_the_email_resets_verification_and_sends_a_new_link(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'old@example.com']);

        $this->actingAs($user)
            ->putJson('/api/profile', ['email' => 'New@Example.com'])
            ->assertOk()
            ->assertJsonPath('data.email', 'new@example.com')
            ->assertJsonPath('data.email_verified_at', null)
            ->assertJsonPath('message', __('api.profile.updated_verify_email'));

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_saving_the_same_email_keeps_the_account_verified(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'same@example.com']);

        $this->actingAs($user)
            ->putJson('/api/profile', ['email' => 'same@example.com', 'name' => 'Nouveau Nom'])
            ->assertOk();

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        Notification::assertNothingSent();
    }

    public function test_role_cannot_be_changed_through_the_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->putJson('/api/profile', ['role' => 'admin', 'name' => 'Omar Tazi'])->assertOk();

        $this->assertTrue($user->fresh()->isClient());
    }

    public function test_guest_gets_401(): void
    {
        $this->putJson('/api/profile', ['name' => 'Omar'])->assertUnauthorized();
    }
}
