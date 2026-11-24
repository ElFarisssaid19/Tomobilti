<?php

namespace App\Http\Resources\Admin;

use App\Models\ReservationStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One step of a reservation's status history. `author` is null for the scheduler
 * (expired requests); `author.role` tells the customer from the agency.
 *
 * @mixin ReservationStatusHistory
 */
class StatusHistoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'from_status' => $this->from_status?->value,
            'from_status_label' => $this->from_status?->label(),
            'to_status' => $this->to_status->value,
            'to_status_label' => $this->to_status->label(),
            'note' => $this->note,
            'author' => $this->whenLoaded('user', fn (): ?array => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'role' => $this->user->role->value,
                'role_label' => $this->user->role->label(),
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
