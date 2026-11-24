<?php

namespace App\Http\Resources\Admin;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Brand in the settings, with the number of cars using it (removed cars included).
 *
 * @mixin Brand
 */
class AdminBrandResource extends JsonResource
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
            'cars_count' => $this->whenCounted('cars'),
        ];
    }
}
