<?php

namespace App\Http\Controllers\Catalog;

use App\Enums\CarStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\CarAvailabilityRequest;
use App\Http\Resources\CarAvailabilityResource;
use App\Models\Car;

class CarAvailabilityController extends Controller
{
    /**
     * GET /api/cars/{slug}/availability?from=&to=: the days the car is already booked,
     * for the calendar of the detail page (6 months at most).
     */
    public function __invoke(CarAvailabilityRequest $request, Car $car): CarAvailabilityResource
    {
        abort_unless($car->status === CarStatus::Available, 404);

        $from = $request->windowStart();
        $to = $request->windowEnd();

        return new CarAvailabilityResource([
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'unavailable' => $car->unavailableDateRanges($from, $to),
        ]);
    }
}
