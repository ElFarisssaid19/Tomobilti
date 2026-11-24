<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BrandRequest;
use App\Http\Resources\Admin\AdminBrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/**
 * Settings: brands, A → Z. A brand used by a car (removed cars included) cannot be deleted.
 */
class BrandController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Brand::class);

        return AdminBrandResource::collection(
            Brand::query()->withCount(['cars' => fn ($cars) => $cars->withTrashed()])->orderBy('name')->get(),
        );
    }

    public function store(BrandRequest $request): JsonResponse
    {
        Gate::authorize('create', Brand::class);

        $brand = Brand::create([...$request->validated(), 'slug' => Brand::uniqueSlugFor($request->validated('name'))]);

        return (new AdminBrandResource($brand->loadCount('cars')))
            ->additional(['message' => __('api.admin.settings.saved')])
            ->response()
            ->setStatusCode(201);
    }

    public function update(BrandRequest $request, Brand $brand): AdminBrandResource
    {
        Gate::authorize('update', $brand);

        $brand->update($request->validated());

        return (new AdminBrandResource($brand->loadCount(['cars' => fn ($cars) => $cars->withTrashed()])))
            ->additional(['message' => __('api.admin.settings.saved')]);
    }

    public function destroy(Brand $brand): JsonResponse
    {
        Gate::authorize('delete', $brand);

        $cars = $brand->cars()->withTrashed()->count();

        if ($cars > 0) {
            return response()->json(['message' => trans_choice('api.admin.settings.brand_in_use', $cars), 'code' => 'in_use'], 409);
        }

        $brand->delete();

        return response()->json(['message' => __('api.admin.settings.deleted')]);
    }
}
