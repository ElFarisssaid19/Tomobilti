<?php

namespace App\Http\Resources;

use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Pick-up point (airport desk or agency) with its public contact details.
 *
 * @mixin Location
 */
class LocationResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'city' => $this->city,
            'address' => $this->address,
            'phone' => $this->phone,
            'opening_hours' => $this->opening_hours,
            'cars_count' => $this->whenCounted('cars'),
        ];
    }
}
