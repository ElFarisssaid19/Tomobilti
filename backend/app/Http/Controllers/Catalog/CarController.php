<?php

namespace App\Http\Controllers\Catalog;

use App\Enums\CarStatus;
use App\Filters\CarFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\CarIndexRequest;
use App\Http\Resources\CarDetailResource;
use App\Http\Resources\CarResource;
use App\Models\Car;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Public catalogue: the list of available cars and the detail of one car.
 */
class CarController extends Controller
{
    /**
     * GET /api/cars: available cars, filtered and sorted by CarFilter, 12 per page.
     */
    public function index(CarIndexRequest $request): AnonymousResourceCollection
    {
        $query = Car::query()->available()->with(CarResource::RELATIONS);

        $cars = (new CarFilter($request->validated()))
            ->apply($query)
            ->paginate(config('tomobilti.catalog.per_page'))
            ->withQueryString();

        return CarResource::collection($cars);
    }

    /**
     * GET /api/cars/{slug}: one available car with all its photos and similar cars
     * of the same category. Cars in maintenance, out of service or removed from the
     * fleet (soft deleted, already excluded by the route binding) answer 404.
     */
    public function show(Car $car): CarDetailResource
    {
        abort_unless($car->status === CarStatus::Available, 404);

        $similar = $car->similarCars(config('tomobilti.catalog.similar_count'))->load(CarResource::RELATIONS);

        return (new CarDetailResource($car->load(CarDetailResource::RELATIONS)))
            ->additional(['similar' => CarResource::collection($similar)]);
    }
}
