<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExtraRequest;
use App\Http\Resources\Admin\AdminExtraResource;
use App\Models\Extra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/**
 * Settings: booking options, active or not. An option already booked cannot be
 * deleted (reservations keep it in their price breakdown): deactivate it instead.
 */
class ExtraController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Extra::class);

        return AdminExtraResource::collection(Extra::query()->withCount('reservations')->orderBy('id')->get());
    }

    public function store(ExtraRequest $request): JsonResponse
    {
        Gate::authorize('create', Extra::class);

        $extra = Extra::create([...$request->validated(), 'slug' => Extra::uniqueSlugFor($request->validated('name'))]);

        return (new AdminExtraResource($extra->loadCount('reservations')))
            ->additional(['message' => __('api.admin.settings.saved')])
            ->response()
            ->setStatusCode(201);
    }

    public function update(ExtraRequest $request, Extra $extra): AdminExtraResource
    {
        Gate::authorize('update', $extra);

        $extra->update($request->validated());

        return (new AdminExtraResource($extra->loadCount('reservations')))
            ->additional(['message' => __('api.admin.settings.saved')]);
    }

    public function destroy(Extra $extra): JsonResponse
    {
        Gate::authorize('delete', $extra);

        if ($extra->reservations()->exists()) {
            return response()->json(['message' => __('api.admin.settings.extra_in_use'), 'code' => 'in_use'], 409);
        }

        $extra->delete();

        return response()->json(['message' => __('api.admin.settings.deleted')]);
    }
}
