<?php

namespace App\Notifications\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

/**
 * "Vérifiez votre adresse e-mail", sent after registration and after an email change.
 *
 * The link opens the React page FRONTEND_URL/verifier-email. It carries the
 * parameters of a signed API URL (id, hash, expires, signature); the page sends
 * them back to POST /api/auth/email/verify/{id}/{hash}, whose signature Laravel checks.
 */
class VerifyEmailNotification extends VerifyEmail implements ShouldQueue
{
    use Queueable;

    /**
     * Link to the SPA page that confirms the address.
     *
     * @param  User  $notifiable
     */
    protected function verificationUrl($notifiable): string
    {
        $signedApiUrl = URL::temporarySignedRoute(
            'auth.verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );

        parse_str((string) parse_url($signedApiUrl, PHP_URL_QUERY), $signature);

        return rtrim(config('app.frontend_url'), '/').'/verifier-email?'.http_build_query([
            'id' => $notifiable->getKey(),
            'hash' => sha1($notifiable->getEmailForVerification()),
            'expires' => $signature['expires'],
            'signature' => $signature['signature'],
        ]);
    }

    /**
     * French email built with the Tomobilti mail theme.
     *
     * @param  string  $url
     */
    protected function buildMailMessage($url): MailMessage
    {
        return (new MailMessage)
            ->subject('Vérifiez votre adresse e-mail')
            ->greeting('Bienvenue sur Tomobilti')
            ->line('Merci pour votre inscription. Confirmez votre adresse e-mail pour pouvoir réserver une voiture.')
            ->action('Vérifier mon adresse e-mail', $url)
            ->line('Ce lien est valable '.Config::get('auth.verification.expire', 60).' minutes.')
            ->line('Si vous n’avez pas créé de compte, ignorez simplement cet e-mail.')
            ->salutation('À bientôt sur la route,  '."\n".'L’équipe Tomobilti');
    }
}
