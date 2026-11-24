<?php

namespace App\Http\Resources\Admin;

use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A car as the back office sees it: every column, internal ones included (plate,
 * mileage, status, soft delete), the ids the edit form needs and, when loaded, the
 * photos in display order.
 *
 * @mixin Car
 */
class AdminCarResource extends JsonResource
{
    /**
     * Relations of the fleet table.
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
            'name' => $this->relationLoaded('brand') ? "{$this->brand->name} {$this->model}" : $this->model,
            'brand_id' => $this->brand_id,
            'category_id' => $this->category_id,
            'location_id' => $this->location_id,
            'brand' => $this->whenLoaded('brand', fn (): array => ['id' => $this->brand->id, 'name' => $this->brand->name]),
            'category' => $this->whenLoaded('category', fn (): array => ['id' => $this->category->id, 'name' => $this->category->name]),
            'location' => $this->whenLoaded('location', fn (): array => [
                'id' => $this->location->id,
                'name' => $this->location->name,
                'city' => $this->location->city,
            ]),
            'model' => $this->model,
            'year' => $this->year,
            'plate_number' => $this->plate_number,
            'color' => $this->color,
            'transmission' => $this->transmission->value,
            'transmission_label' => $this->transmission->label(),
            'fuel' => $this->fuel->value,
            'fuel_label' => $this->fuel->label(),
            'seats' => $this->seats,
            'doors' => $this->doors,
            'luggage' => $this->luggage,
            'air_conditioning' => $this->air_conditioning,
            'mileage' => $this->mileage,
            'price_per_day' => $this->price_per_day,
            'deposit_amount' => $this->deposit_amount,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'description' => $this->description,
            'is_featured' => $this->is_featured,
            'is_deleted' => $this->trashed(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'primary_image' => new AdminCarImageResource($this->whenLoaded('primaryImage')),
            'images' => AdminCarImageResource::collection($this->whenLoaded('images')),
            'upcoming_reservations_count' => $this->whenCounted('upcoming_reservations'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
