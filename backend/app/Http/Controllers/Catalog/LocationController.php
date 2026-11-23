<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LocationController extends Controller
{
    /**
     * GET /api/locations: active pick-up points with their address, phone and hours.
     */
    public function index(): AnonymousResourceCollection
    {
        $locations = Location::query()
            ->where('is_active', true)
            ->orderBy('city')
            ->orderBy('name')
            ->get();

        return LocationResource::collection($locations);
    }
}
