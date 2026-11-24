<?php

namespace App\Http\Resources\Admin;

use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A reservation as a row of the back office (tables, dashboard lists, planning):
 * client contact, car with its plate and photo, agencies, dates, total and status.
 *
 * Load RELATIONS before building it, to avoid queries per row.
 *
 * @mixin Reservation
 */
class AdminReservationResource extends JsonResource
{
    /**
     * @var list<string>
     */
    public const RELATIONS = ['user', 'car.brand', 'car.primaryImage', 'pickupLocation', 'returnLocation'];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'start_at' => $this->start_at->toIso8601String(),
            'end_at' => $this->end_at->toIso8601String(),
            'days' => $this->days,
            'total' => $this->total,
            'client' => $this->whenLoaded('user', fn (): array => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ]),
            'car' => $this->whenLoaded('car', fn (): array => [
                'id' => $this->car->id,
                'slug' => $this->car->slug,
                'name' => $this->car->relationLoaded('brand') ? "{$this->car->brand->name} {$this->car->model}" : $this->car->model,
                'year' => $this->car->year,
                'plate_number' => $this->car->plate_number,
                'is_deleted' => $this->car->trashed(),
                'thumbnail_url' => $this->car->relationLoaded('primaryImage') ? $this->car->primaryImage?->thumbnail_url : null,
            ]),
            'pickup_location' => $this->whenLoaded('pickupLocation', fn (): array => [
                'id' => $this->pickupLocation->id,
                'name' => $this->pickupLocation->name,
            ]),
            'return_location' => $this->whenLoaded('returnLocation', fn (): array => [
                'id' => $this->returnLocation->id,
                'name' => $this->returnLocation->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
