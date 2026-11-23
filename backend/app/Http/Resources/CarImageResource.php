<?php

namespace App\Http\Resources;

use App\Models\CarImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Car photo in two widths (800px `thumbnail_url` for cards, 1600px `url` for the
 * gallery) with the credit its license requires.
 *
 * @mixin CarImage
 */
class CarImageResource extends JsonResource
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
            'url' => $this->url,
            'thumbnail_url' => $this->thumbnail_url,
            'alt' => $this->alt,
            'is_primary' => $this->is_primary,
            'author' => $this->author,
            'license' => $this->license,
            'license_url' => $this->license_url,
            'source_url' => $this->source_url,
        ];
    }
}
