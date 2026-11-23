<?php

namespace App\Http\Resources;

use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A car as the catalogue cards show it. Internal fields (plate number, mileage,
 * status) are never exposed.
 *
 * Load RELATIONS before building it, to avoid one query per car.
 *
 * @mixin Car
 */
class CarResource extends JsonResource
{
    /**
     * Relations used by this resource: eager-load them with `Car::with(CarResource::RELATIONS)`.
     *
     * @var list<string>
     */
    public const RELATIONS = ['brand', 'category', 'location', 'primaryImage'];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->relationLoaded('brand') ? $this->brand->name.' '.$this->model : $this->model,
            'brand' => new BrandResource($this->whenLoaded('brand')),
            'model' => $this->model,
            'year' => $this->year,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'location' => new LocationResource($this->whenLoaded('location')),
            'transmission' => $this->transmission->value,
            'fuel' => $this->fuel->value,
            'seats' => $this->seats,
            'doors' => $this->doors,
            'luggage' => $this->luggage,
            'air_conditioning' => $this->air_conditioning,
            'price_per_day' => $this->price_per_day,
            'deposit_amount' => $this->deposit_amount,
            'is_featured' => $this->is_featured,
            'primary_image' => new CarImageResource($this->whenLoaded('primaryImage')),
        ];
    }
}
