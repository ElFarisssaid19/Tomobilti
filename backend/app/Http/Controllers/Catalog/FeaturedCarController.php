<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\CarResource;
use App\Models\Car;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FeaturedCarController extends Controller
{
    /**
     * GET /api/cars/featured: the available cars chosen for the home page.
     */
    public function __invoke(): AnonymousResourceCollection
    {
        $cars = Car::query()
            ->available()
            ->featured()
            ->with(CarResource::RELATIONS)
            ->orderBy('price_per_day')
            ->orderBy('id')
            ->get();

        return CarResource::collection($cars);
    }
}
