<?php

namespace App\Http\Resources;

use App\Models\Reservation;
use App\Services\PriceBreakdown;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Page of one reservation: the row fields plus every car photo, the agencies with
 * their address, hours and phone, the extras and price breakdown (from the snapshots),
 * the status timestamps and whether the customer can still cancel.
 *
 * @mixin Reservation
 */
class ReservationDetailResource extends ReservationResource
{
    /**
     * @var list<string>
     */
    public const RELATIONS = [...ReservationResource::RELATIONS, 'car.images', 'extras'];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $cancellation = Gate::forUser($request->user())->inspect('cancel', $this->resource);

        return [
            ...parent::toArray($request),
            'car' => new CarDetailResource($this->whenLoaded('car')),
            'pricing' => PriceBreakdown::fromReservation($this->resource)->toArray(),
            'customer_notes' => $this->customer_notes,
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
            'cancellation' => [
                'allowed' => $cancellation->allowed(),
                'reason' => $cancellation->allowed() ? null : $cancellation->message(),
                'free_until' => $this->freeCancellationDeadline()->toIso8601String(),
            ],
        ];
    }
}
