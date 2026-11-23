<?php

namespace App\Http\Resources;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * Everything the catalogue's filter panel needs, in one response.
 *
 * @property-read array{
 *     categories: Collection<int, Category>,
 *     brands: Collection<int, Brand>,
 *     locations: Collection<int, Location>,
 *     transmissions: list<array{value: string, label: string}>,
 *     fuels: list<array{value: string, label: string}>,
 *     seats: list<int>,
 *     price: array{min: int, max: int},
 * } $resource
 */
class CatalogFiltersResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'categories' => CategoryResource::collection($this->resource['categories']),
            'brands' => BrandResource::collection($this->resource['brands']),
            'locations' => LocationResource::collection($this->resource['locations']),
            'transmissions' => $this->resource['transmissions'],
            'fuels' => $this->resource['fuels'],
            'seats' => $this->resource['seats'],
            'price' => $this->resource['price'],
        ];
    }
}
