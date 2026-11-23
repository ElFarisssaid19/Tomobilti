<?php

namespace App\Http\Resources;

use App\Models\Extra;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Optional add-on (GPS, baby seat...), chosen with a quantity in the booking flow.
 *
 * @mixin Extra
 */
class ExtraResource extends JsonResource
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
            'description' => $this->description,
            'icon' => $this->icon,
            'price' => $this->price,
            'pricing' => $this->pricing->value,
            'pricing_label' => $this->pricing->label(),
            'max_quantity' => $this->max_quantity,
        ];
    }
}
