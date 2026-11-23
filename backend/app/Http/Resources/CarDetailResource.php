<?php

namespace App\Http\Resources;

use App\Models\Car;
use Illuminate\Http\Request;

/**
 * Car detail page: the card fields plus the description, the color and every photo.
 *
 * @mixin Car
 */
class CarDetailResource extends CarResource
{
    /**
     * @var list<string>
     */
    public const RELATIONS = ['brand', 'category', 'location', 'primaryImage', 'images'];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'color' => $this->color,
            'description' => $this->description,
            'images' => CarImageResource::collection($this->whenLoaded('images')),
        ];
    }
}
