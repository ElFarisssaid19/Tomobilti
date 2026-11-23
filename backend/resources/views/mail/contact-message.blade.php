<x-mail::message>
# Nouveau message depuis le site

**{{ $senderName }}** a écrit via le formulaire de contact. Répondez simplement à cet e-mail pour lui écrire.

<x-mail::panel>
**Sujet :** {{ $topic }}<br>
**E-mail :** {{ $senderEmail }}<br>
**Téléphone :** {{ $senderPhone ?: 'non renseigné' }}
</x-mail::panel>

{!! nl2br(e($body)) !!}

<x-mail::subcopy>
Message envoyé depuis la page Contact de Tomobilti.
</x-mail::subcopy>
</x-mail::message>
