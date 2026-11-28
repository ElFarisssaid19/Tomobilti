<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use App\Services\CatalogCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * GET /api/locations: active pick-up points with their address, phone and hours.
     */
    public function index(Request $request): JsonResponse
    {
        $locations = CatalogCache::remember('locations', fn (): array => LocationResource::collection(
            Location::query()
                ->where('is_active', true)
                ->orderBy('city')
                ->orderBy('name')
                ->get()
        )->response($request)->getData(true)['data']);

        return response()->json(['data' => $locations]);
    }
}
