<?php

namespace App\Http\Resources\Admin;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An invoice in the back office: amounts, payment, and the reservation, client and
 * car it bills. Load RELATIONS first.
 *
 * @mixin Invoice
 */
class AdminInvoiceResource extends JsonResource
{
    /**
     * @var list<string>
     */
    public const RELATIONS = ['reservation.user', 'reservation.car.brand'];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $reservation = $this->reservation;

        return [
            'number' => $this->number,
            'issued_at' => $this->issued_at->toIso8601String(),
            'subtotal_ht' => $this->subtotal_ht,
            'vat_rate' => $this->vat_rate,
            'vat_amount' => $this->vat_amount,
            'total_ttc' => $this->total_ttc,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'payment_method' => $this->payment_method?->value,
            'payment_method_label' => $this->payment_method?->label(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'reservation' => $this->whenLoaded('reservation', fn (): array => [
                'reference' => $reservation->reference,
                'status' => $reservation->status->value,
                'start_at' => $reservation->start_at->toIso8601String(),
                'end_at' => $reservation->end_at->toIso8601String(),
                'client' => $reservation->relationLoaded('user') ? [
                    'id' => $reservation->user->id,
                    'name' => $reservation->user->name,
                    'email' => $reservation->user->email,
                ] : null,
                'car' => $reservation->relationLoaded('car') ? [
                    'id' => $reservation->car->id,
                    'name' => $reservation->car->brand->name.' '.$reservation->car->model,
                    'plate_number' => $reservation->car->plate_number,
                ] : null,
            ]),
        ];
    }
}
