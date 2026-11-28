<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CatalogCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * GET /api/categories: every category in display order, with its available cars count.
     */
    public function index(Request $request): JsonResponse
    {
        $categories = CatalogCache::remember('categories', fn (): array => CategoryResource::collection(
            Category::query()
                ->withCount(['cars' => fn (Builder $cars) => $cars->available()])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        )->response($request)->getData(true)['data']);

        return response()->json(['data' => $categories]);
    }
}
