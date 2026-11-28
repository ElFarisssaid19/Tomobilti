<?php

namespace App\Http\Controllers\Catalog;

use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Http\Controllers\Controller;
use App\Http\Resources\CatalogFiltersResource;
use App\Models\Brand;
use App\Models\Car;
use App\Models\Category;
use App\Models\Location;
use App\Services\CatalogCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogFilterController extends Controller
{
    /**
     * GET /api/catalog/filters: options of the filter panel, with the number of
     * available cars for each category, brand and location.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $filters = CatalogCache::remember('filters', fn (): array => $this->filters()->response($request)->getData(true)['data']);

        return response()->json(['data' => $filters]);
    }

    /**
     * The filter options, read from the database (cached by __invoke).
     */
    private function filters(): CatalogFiltersResource
    {
        $availableCars = fn (Builder $cars) => $cars->available();

        $price = Car::query()->available()
            ->selectRaw('MIN(price_per_day) as min_price, MAX(price_per_day) as max_price')
            ->toBase()
            ->first();

        return new CatalogFiltersResource([
            'categories' => Category::query()->withCount(['cars' => $availableCars])->orderBy('sort_order')->orderBy('name')->get(),
            'brands' => Brand::query()->whereHas('cars', $availableCars)->withCount(['cars' => $availableCars])->orderBy('name')->get(),
            'locations' => Location::query()->where('is_active', true)->withCount(['cars' => $availableCars])->orderBy('city')->orderBy('name')->get(),
            'transmissions' => Transmission::options(),
            'fuels' => FuelType::options(),
            'seats' => Car::query()->available()->distinct()->orderBy('seats')->pluck('seats')->map(fn ($seats): int => (int) $seats)->all(),
            'price' => [
                'min' => (int) floor((float) ($price->min_price ?? 0)),
                'max' => (int) ceil((float) ($price->max_price ?? 0)),
            ],
        ]);
    }
}
