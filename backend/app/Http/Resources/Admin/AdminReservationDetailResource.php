<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\LocationResource;
use App\Models\Reservation;
use App\Services\PriceBreakdown;
use Illuminate\Http\Request;

/**
 * Back-office page of one reservation: the row fields plus the client's profile,
 * the agencies with their contact details, the price breakdown (snapshots), the
 * notes and reasons, the lifecycle timestamps, the invoice and the full status
 * history (who changed what, when, and why).
 *
 * @mixin Reservation
 */
class AdminReservationDetailResource extends AdminReservationResource
{
    /**
     * @var list<string>
     */
    public const RELATIONS = [...AdminReservationResource::RELATIONS, 'extras', 'invoice', 'statusHistories.user'];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'client' => $this->whenLoaded('user', fn (): array => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
                'city' => $this->user->city,
                'cin' => $this->user->cin,
                'driving_license_number' => $this->user->driving_license_number,
                'driving_license_issued_at' => $this->user->driving_license_issued_at?->toDateString(),
                'is_active' => $this->user->is_active,
            ]),
            'pickup_location' => new LocationResource($this->whenLoaded('pickupLocation')),
            'return_location' => new LocationResource($this->whenLoaded('returnLocation')),
            'pricing' => PriceBreakdown::fromReservation($this->resource)->toArray(),
            'customer_notes' => $this->customer_notes,
            'admin_notes' => $this->admin_notes,
            'rejection_reason' => $this->rejection_reason,
            'cancellation_reason' => $this->cancellation_reason,
            'timeline' => [
                'created_at' => $this->created_at?->toIso8601String(),
                'confirmed_at' => $this->confirmed_at?->toIso8601String(),
                'picked_up_at' => $this->picked_up_at?->toIso8601String(),
                'returned_at' => $this->returned_at?->toIso8601String(),
                'cancelled_at' => $this->cancelled_at?->toIso8601String(),
                'rejected_at' => $this->rejected_at?->toIso8601String(),
            ],
            'invoice' => $this->whenLoaded('invoice', fn (): ?array => $this->invoice ? [
                'number' => $this->invoice->number,
                'status' => $this->invoice->status->value,
                'status_label' => $this->invoice->status->label(),
            ] : null),
            'history' => StatusHistoryResource::collection($this->whenLoaded('statusHistories')),
        ];
    }
}
