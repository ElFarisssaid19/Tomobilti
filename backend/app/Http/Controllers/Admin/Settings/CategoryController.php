<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\Admin\AdminCategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/**
 * Settings: car categories, in display order. A category used by a car (removed cars
 * included) cannot be deleted.
 */
class CategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Category::class);

        return AdminCategoryResource::collection(
            Category::query()->withCount(['cars' => fn ($cars) => $cars->withTrashed()])->orderBy('sort_order')->orderBy('name')->get(),
        );
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        Gate::authorize('create', Category::class);

        $category = Category::create([...$request->validated(), 'slug' => Category::uniqueSlugFor($request->validated('name'))]);

        return (new AdminCategoryResource($category->loadCount('cars')))
            ->additional(['message' => __('api.admin.settings.created.category')])
            ->response()
            ->setStatusCode(201);
    }

    public function update(CategoryRequest $request, Category $category): AdminCategoryResource
    {
        Gate::authorize('update', $category);

        $category->update($request->validated());

        return (new AdminCategoryResource($category->loadCount(['cars' => fn ($cars) => $cars->withTrashed()])))
            ->additional(['message' => __('api.admin.settings.updated.category')]);
    }

    public function destroy(Category $category): JsonResponse
    {
        Gate::authorize('delete', $category);

        $cars = $category->cars()->withTrashed()->count();

        if ($cars > 0) {
            return response()->json(['message' => trans_choice('api.admin.settings.category_in_use', $cars), 'code' => 'in_use'], 409);
        }

        $category->delete();

        return response()->json(['message' => __('api.admin.settings.deleted.category')]);
    }
}
