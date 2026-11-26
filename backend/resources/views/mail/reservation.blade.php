{{--
    Every reservation email (client and agency): a title, one line, the key details,
    an optional reason or checklist, one button. Built by App\Notifications\ReservationNotification.
    Details end with two spaces (a Markdown line break), so the plain-text part keeps one per line.
--}}
<x-mail::message>
# {{ $title }}

{{ $intro }}

<x-mail::panel>
{!! collect($details)->map(fn ($value, $label) => e($label).' : **'.e($value).'**')->implode("  \n") !!}
</x-mail::panel>

@if ($note)
**{{ $note['label'] }}** : {{ $note['text'] }}

@endif
@if ($list)
**{{ $list['title'] }}**

@foreach ($list['items'] as $item)
- {{ $item }}
@endforeach

@endif
<x-mail::button :url="$actionUrl">
{{ $actionText }}
</x-mail::button>

@if ($outro)
{{ $outro }}

@endif
L’équipe Tomobilti
</x-mail::message>
