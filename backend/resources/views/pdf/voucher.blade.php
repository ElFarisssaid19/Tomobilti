@php
    use App\Services\FrenchFormatter as Fr;
    $car = $reservation->car;
    $client = $reservation->user;
    $sameAgency = $reservation->pickup_location_id === $reservation->return_location_id;
@endphp
@extends('pdf.layout')

@section('content')
<table>
    <tr>
        <td><span class="wordmark">tomobilti<span class="dot">.</span></span></td>
        <td class="right">
            <p class="doc-title">Bon de réservation</p>
            <p class="doc-meta muted">Émis le {{ Fr::date(now()) }}</p>
        </td>
    </tr>
</table>

<table class="section">
    <tr>
        <td style="width: 52%; padding-right: 14px;">
            <div class="key">
                <p class="key-label">Référence</p>
                <p class="key-value">{{ $reservation->reference }}</p>
                <p class="small semibold">{{ $reservation->status->label() }}</p>
            </div>
        </td>
        <td class="box">
            <p class="label">Client</p>
            <p class="bold">{{ $client->name }}</p>
            @if ($client->cin)<p>CIN {{ $client->cin }}</p>@endif
            @if ($client->phone)<p>{{ Fr::phone($client->phone) }}</p>@endif
            <p>{{ $client->email }}</p>
        </td>
    </tr>
</table>

<div class="section box">
    <table>
        <tr>
            <td>
                <p class="label">Voiture</p>
                <p class="bold" style="font-size: 11pt;">{{ $car->brand->name }} {{ $car->model }} {{ $car->year }}</p>
                <p class="muted">Immatriculation {{ $car->plate_number }}</p>
            </td>
            <td class="right">
                <p class="label">Durée</p>
                <p class="bold" style="font-size: 11pt;">{{ $reservation->days }} {{ $reservation->days > 1 ? 'jours' : 'jour' }}</p>
            </td>
        </tr>
    </table>
</div>

<table class="section">
    <tr>
        @foreach ([['Prise en charge', $reservation->start_at, $reservation->pickupLocation], ['Restitution', $reservation->end_at, $reservation->returnLocation]] as [$caption, $when, $location])
            <td class="box" style="width: 50%;">
                <p class="label">{{ $caption }}</p>
                <p class="bold">{{ ucfirst(Fr::dateTime($when)) }}</p>
                <p class="semibold" style="margin-top: 6px;">{{ $location->name }}</p>
                <p class="muted">{{ $location->address }}</p>
                @if ($location->opening_hours)<p class="muted">Horaires : {{ $location->opening_hours }}</p>@endif
                @if ($location->phone)<p class="muted">{{ Fr::phone($location->phone) }}</p>@endif
            </td>
            @if ($loop->first)<td style="width: 12px;"></td>@endif
        @endforeach
    </tr>
</table>

<div class="section">
    <table class="lines">
        <thead>
            <tr><th>Désignation</th><th></th><th class="right">Montant TTC</th></tr>
        </thead>
        <tbody>
            @foreach ($lines as $line)
                <tr>
                    <td class="semibold">{{ $line['label'] }}</td>
                    <td class="muted">{{ $line['detail'] }}</td>
                    <td class="amount">{{ Fr::money($line['amount']) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <table class="totals" style="margin-top: 6px;">
        <tr class="grand">
            <td>Total à régler à l’agence</td>
            <td class="amount">{{ Fr::money($pricing->total) }}</td>
        </tr>
        <tr>
            <td class="muted">Caution, bloquée sur la carte et libérée au retour</td>
            <td class="amount muted">{{ Fr::money($pricing->depositAmount) }}</td>
        </tr>
    </table>
</div>

<table class="section notes">
    <tr>
        <td style="width: 50%; padding-right: 14px;">
            <p class="section-title">Documents à présenter</p>
            <ul class="checklist">
                @foreach ($documents as $document)
                    <li><span class="semibold">{{ $document['label'] }}</span>, {{ $document['detail'] }}</li>
                @endforeach
            </ul>
        </td>
        <td>
            <p class="section-title">Bon à savoir</p>
            <ul class="checklist">
                <li>Paiement à l’agence, en espèces, par carte ou par virement</li>
                @if ($reservation->status === \App\Enums\ReservationStatus::Confirmed && $reservation->freeCancellationDeadline()->isFuture())
                    <li>Annulation gratuite jusqu’au {{ Fr::dateTime($reservation->freeCancellationDeadline()) }}</li>
                @endif
                @unless ($sameAgency)<li>Retour dans une autre agence inclus dans le prix</li>@endunless
            </ul>
        </td>
    </tr>
</table>
@endsection
