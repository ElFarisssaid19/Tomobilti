<?php

namespace Tests\Feature;

use App\Mail\ContactMessageMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function message(array $overrides = []): array
    {
        return [
            'name' => 'Youssef Amrani',
            'email' => 'Youssef@Example.com',
            'phone' => '+33 6 12 34 56 78',
            'subject' => 'Siège bébé',
            'message' => 'Bonjour, pouvez-vous prévoir un siège bébé pour mon arrivée ?',
            ...$overrides,
        ];
    }

    public function test_queues_the_message_to_the_agency_with_the_visitor_as_reply_to(): void
    {
        Mail::fake();

        $this->postJson('/api/contact', $this->message())
            ->assertOk()
            ->assertJsonPath('message', 'Merci, votre message a bien été envoyé. L’agence vous répondra par e-mail.');

        Mail::assertQueued(ContactMessageMail::class, fn (ContactMessageMail $mail): bool => $mail->hasTo('contact@tomobilti.ma')
            && $mail->hasReplyTo('youssef@example.com', 'Youssef Amrani')
            && $mail->topic === 'Siège bébé'
            && $mail->senderPhone === '+33 6 12 34 56 78');
    }

    public function test_the_email_is_in_french_and_escapes_the_visitor_input(): void
    {
        $mail = new ContactMessageMail(
            senderName: 'Youssef Amrani',
            senderEmail: 'youssef@example.com',
            topic: 'Siège bébé',
            body: "Bonjour,\n<script>alert(1)</script>",
        );

        $mail->assertHasSubject('Nouveau message : Siège bébé');
        $mail->assertSeeInHtml('Nouveau message depuis le site');
        $mail->assertSeeInHtml('non renseigné');
        $mail->assertSeeInHtml('&lt;script&gt;', false);
        $mail->assertDontSeeInHtml('<script>alert(1)</script>', false);
    }

    public function test_an_empty_form_lists_the_required_fields(): void
    {
        Mail::fake();

        $this->postJson('/api/contact', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name' => 'Le champ nom est obligatoire.',
                'email' => 'Le champ adresse e-mail est obligatoire.',
                'subject' => 'Le champ sujet est obligatoire.',
                'message' => 'Le champ message est obligatoire.',
            ])
            ->assertJsonMissingValidationErrors(['phone']);

        Mail::assertNothingQueued();
    }

    /**
     * @return array<string, array{array<string, string>, string, string}>
     */
    public static function invalidFields(): array
    {
        return [
            'email' => [['email' => 'pas-une-adresse'], 'email', 'Le champ adresse e-mail doit être une adresse e-mail valide.'],
            'phone' => [['phone' => 'appelez-moi'], 'phone', 'Saisissez un numéro de téléphone valide, par exemple 06 12 34 56 78 ou +33 6 12 34 56 78.'],
            'short message' => [['message' => 'Allô ?'], 'message', 'Le texte de message doit contenir au moins 10 caractères.'],
        ];
    }

    /**
     * @param  array<string, string>  $overrides
     */
    #[DataProvider('invalidFields')]
    public function test_rejects_an_invalid_field(array $overrides, string $field, string $message): void
    {
        Mail::fake();

        $this->postJson('/api/contact', $this->message($overrides))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$field => $message]);

        Mail::assertNothingQueued();
    }

    public function test_allows_three_messages_per_ten_minutes_per_ip_address(): void
    {
        Mail::fake();

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->postJson('/api/contact', $this->message())->assertOk();
        }

        $this->postJson('/api/contact', $this->message())
            ->assertTooManyRequests()
            ->assertHeader('Retry-After')
            ->assertJsonPath('message', 'Vous avez déjà envoyé plusieurs messages. Réessayez dans 10 minutes ou appelez l’agence.');

        Mail::assertQueuedCount(3);

        $this->travel(10)->minutes();
        $this->postJson('/api/contact', $this->message())->assertOk();
    }
}
