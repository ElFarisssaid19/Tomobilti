<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\CarImageResource;
use App\Models\CarImage;
use Illuminate\Http\Request;

/**
 * A car photo in the image manager: the public fields plus its position, and
 * whether it is an SVG placeholder (replaced by the first real upload).
 *
 * @mixin CarImage
 */
class AdminCarImageResource extends CarImageResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'sort_order' => $this->sort_order,
            'is_placeholder' => $this->isPlaceholder(),
        ];
    }
}
