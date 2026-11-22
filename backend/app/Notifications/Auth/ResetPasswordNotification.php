<?php

namespace App\Notifications\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * "Réinitialisez votre mot de passe". The link opens the React page
 * FRONTEND_URL/reinitialiser-mot-de-passe?token=...&email=..., which posts
 * the new password to POST /api/auth/reset-password.
 */
class ResetPasswordNotification extends ResetPassword implements ShouldQueue
{
    use Queueable;

    /**
     * Link to the SPA page where the user chooses a new password.
     *
     * @param  User  $notifiable
     */
    protected function resetUrl($notifiable): string
    {
        return rtrim(config('app.frontend_url'), '/').'/reinitialiser-mot-de-passe?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
    }

    /**
     * French email built with the Tomobilti mail theme.
     *
     * @param  string  $url
     */
    protected function buildMailMessage($url): MailMessage
    {
        $expire = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new MailMessage)
            ->subject('Réinitialisez votre mot de passe')
            ->greeting('Bonjour,')
            ->line('Vous avez demandé à réinitialiser le mot de passe de votre compte Tomobilti.')
            ->action('Choisir un nouveau mot de passe', $url)
            ->line("Ce lien est valable {$expire} minutes.")
            ->line('Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.')
            ->salutation('L’équipe Tomobilti');
    }
}
