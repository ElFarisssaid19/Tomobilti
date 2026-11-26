<?php

namespace App\Http\Resources;

use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A reservation as a row of "Mes réservations": car with its photo, dates, agencies,
 * total and status, whether the voucher can be downloaded and the invoice, if issued. Internal fields (admin notes, user id) are never exposed.
 *
 * Load RELATIONS before building it, to avoid queries per row.
 *
 * @mixin Reservation
 */
class ReservationResource extends JsonResource
{
    /**
     * @var list<string>
     */
    public const RELATIONS = ['car.brand', 'car.category', 'car.primaryImage', 'pickupLocation', 'returnLocation', 'invoice'];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'reference' => $this->reference,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'start_at' => $this->start_at->toIso8601String(),
            'end_at' => $this->end_at->toIso8601String(),
            'days' => $this->days,
            'total' => $this->total,
            'deposit_amount' => $this->deposit_amount,
            'car' => new CarResource($this->whenLoaded('car')),
            'pickup_location' => new LocationResource($this->whenLoaded('pickupLocation')),
            'return_location' => new LocationResource($this->whenLoaded('returnLocation')),
            'has_voucher' => $this->hasVoucher(),
            'invoice' => $this->whenLoaded('invoice', fn (): ?array => $this->invoice ? [
                'number' => $this->invoice->number,
                'status' => $this->invoice->status->value,
                'status_label' => $this->invoice->status->label(),
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
