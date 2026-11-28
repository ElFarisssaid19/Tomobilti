@php
    use App\Services\FrenchFormatter as Fr;
    $car = $reservation->car;
    $client = $reservation->user;
    $vatRate = rtrim(rtrim(number_format((float) $invoice->vat_rate, 2, ',', ''), '0'), ',');
@endphp
@extends('pdf.layout')

@section('content')
<table>
    <tr>
        <td>
            <span class="wordmark">tomobilti<span class="dot">.</span></span>
            <p class="semibold" style="margin-top: 10px;">{{ $company['name'] }}</p>
            <p class="muted">{{ $company['address'] }}</p>
            <p class="muted">{{ $company['city'] }}</p>
            <p class="muted">{{ $company['phone'] }} &nbsp;|&nbsp; {{ $company['email'] }}</p>
        </td>
        <td class="right">
            <p class="doc-title">Facture</p>
            <p class="doc-meta semibold">N° {{ $invoice->number }}</p>
            <p class="muted">Date d’émission : {{ Fr::date($invoice->issued_at) }}</p>
            <p class="muted">Réservation : {{ $reservation->reference }}</p>
        </td>
    </tr>
</table>

<table class="section">
    <tr>
        <td class="box" style="width: 50%;">
            <p class="label">Facturé à</p>
            <p class="bold">{{ $client->name }}</p>
            @if ($client->address)<p>{{ $client->address }}</p>@endif
            @if ($client->city)<p>{{ $client->city }}</p>@endif
            @if ($client->cin)<p>CIN {{ $client->cin }}</p>@endif
            <p class="muted">{{ $client->email }}</p>
        </td>
        <td style="width: 12px;"></td>
        <td class="box">
            <p class="label">Location</p>
            <p class="bold">{{ $car->brand->name }} {{ $car->model }} {{ $car->year }}</p>
            <p>Immatriculation {{ $car->plate_number }}</p>
            <p class="muted">Du {{ Fr::dateTime($reservation->start_at) }}</p>
            <p class="muted">au {{ Fr::dateTime($reservation->end_at) }}</p>
        </td>
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
                    <td class="amount">{{ Fr::invoiceMoney($line['amount']) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>

<table class="section">
    <tr>
        <td style="width: 48%; padding-right: 18px;">
            <p class="label">Paiement</p>
            <p class="semibold">{{ $invoice->payment_method?->label() ?? 'À l’agence' }}</p>
            <p class="muted">
                {{ $invoice->status->label() }}@if ($invoice->paid_at) le {{ Fr::date($invoice->paid_at) }}@endif
            </p>
        </td>
        <td>
            <table class="totals">
                <tr>
                    <td class="muted">Total HT</td>
                    <td class="amount">{{ Fr::invoiceMoney((string) $invoice->subtotal_ht) }}</td>
                </tr>
                <tr>
                    <td class="muted">TVA {{ $vatRate }} %</td>
                    <td class="amount">{{ Fr::invoiceMoney((string) $invoice->vat_amount) }}</td>
                </tr>
            </table>
            <div class="key" style="margin-top: 8px;">
                <table>
                    <tr>
                        <td class="key-label" style="vertical-align: middle;">Total TTC</td>
                        <td class="right key-value nowrap">{{ Fr::invoiceMoney((string) $invoice->total_ttc) }}</td>
                    </tr>
                </table>
            </div>
        </td>
    </tr>
</table>

<p class="section">
    Arrêtée la présente facture à la somme de <span class="semibold">{{ $amountInWords }}</span> TTC.
</p>
@endsection
