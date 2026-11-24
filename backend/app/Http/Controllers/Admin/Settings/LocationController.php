<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LocationRequest;
use App\Http\Resources\Admin\AdminLocationResource;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/**
 * Settings: agencies, active or not. An agency with cars or reservations cannot be
 * deleted: deactivating it removes it from the booking flow instead.
 */
class LocationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Location::class);

        return AdminLocationResource::collection(
            Location::query()->withCount('cars')->orderBy('city')->orderBy('name')->get(),
        );
    }

    public function store(LocationRequest $request): JsonResponse
    {
        Gate::authorize('create', Location::class);

        $location = Location::create([...$request->validated(), 'slug' => Location::uniqueSlugFor($request->validated('name'))]);

        return (new AdminLocationResource($location->loadCount('cars')))
            ->additional(['message' => __('api.admin.settings.saved')])
            ->response()
            ->setStatusCode(201);
    }

    public function update(LocationRequest $request, Location $location): AdminLocationResource
    {
        Gate::authorize('update', $location);

        $location->update($request->validated());

        return (new AdminLocationResource($location->loadCount('cars')))
            ->additional(['message' => __('api.admin.settings.saved')]);
    }

    public function destroy(Location $location): JsonResponse
    {
        Gate::authorize('delete', $location);

        $inUse = $location->cars()->withTrashed()->exists()
            || $location->pickupReservations()->exists()
            || $location->returnReservations()->exists();

        if ($inUse) {
            return response()->json(['message' => __('api.admin.settings.location_in_use'), 'code' => 'in_use'], 409);
        }

        $location->delete();

        return response()->json(['message' => __('api.admin.settings.deleted')]);
    }
}
