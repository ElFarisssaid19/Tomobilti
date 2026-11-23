<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Message sent from the public contact form to the agency, in French, queued.
 */
class ContactMessageMail extends Mailable implements ShouldQueue
{
    use Queueable;

    /**
     * Named "sender..." because Mailable already has a $subject property and mail
     * views reserve the $message variable.
     */
    public function __construct(
        public string $senderName,
        public string $senderEmail,
        public string $topic,
        public string $body,
        public ?string $senderPhone = null,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address($this->senderEmail, $this->senderName)],
            subject: 'Nouveau message : '.$this->topic,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(markdown: 'mail.contact-message');
    }
}
