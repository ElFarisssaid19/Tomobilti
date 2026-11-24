<?php

namespace App\Http\Resources\Admin;

use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Agency in the settings, active or not, with the number of cars based there.
 *
 * @mixin Location
 */
class AdminLocationResource extends JsonResource
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
            'is_active' => $this->is_active,
            'cars_count' => $this->whenCounted('cars'),
        ];
    }
}
