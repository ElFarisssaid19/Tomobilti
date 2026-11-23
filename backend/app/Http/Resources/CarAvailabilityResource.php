<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Unavailable days of a car between two dates. Only dates: never who booked, nor
 * any detail of the reservations.
 *
 * @property-read array{from: string, to: string, unavailable: list<array{from: string, to: string}>} $resource
 */
class CarAvailabilityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'from' => $this->resource['from'],
            'to' => $this->resource['to'],
            'unavailable' => $this->resource['unavailable'],
        ];
    }
}
