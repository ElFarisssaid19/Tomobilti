<?php

namespace App\Filters;

use App\Models\Brand;
use App\Models\Car;
use Illuminate\Database\Eloquent\Builder;

/**
 * Filters of the back-office fleet table (GET /api/admin/cars), validated first by
 * Admin\CarIndexRequest. Same shape as CarFilter: one small method per parameter,
 * each adding an "AND" condition, then the sort.
 *
 * GET /api/admin/cars?q=clio&status=maintenance&deleted=with&sort=price_per_day&direction=desc
 */
final class AdminCarFilter
{
    /**
     * Sortable columns ("name" sorts by brand, then model).
     *
     * @var list<string>
     */
    public const SORTS = ['name', 'price_per_day', 'year', 'mileage', 'status', 'created_at'];

    /**
     * @param  array<string, mixed>  $filters  validated query parameters
     */
    public function __construct(private readonly array $filters) {}

    /**
     * @param  Builder<Car>  $query
     * @return Builder<Car>
     */
    public function apply(Builder $query): Builder
    {
        $this->byDeleted($query);
        $this->bySearch($query);
        $this->byColumn($query, 'status', 'status');
        $this->byColumn($query, 'category', 'category_id');
        $this->byColumn($query, 'brand', 'brand_id');
        $this->byColumn($query, 'location', 'location_id');
        $this->sort($query);

        return $query;
    }

    /**
     * ?deleted=with → removed cars too; ?deleted=only → removed cars only.
     */
    private function byDeleted(Builder $query): void
    {
        match ($this->filters['deleted'] ?? null) {
            'with' => $query->withTrashed(),
            'only' => $query->onlyTrashed(),
            default => null,
        };
    }

    /**
     * ?q=clio → brand, model or plate number contains the words.
     */
    private function bySearch(Builder $query): void
    {
        $search = trim((string) ($this->filters['q'] ?? ''));

        if ($search === '') {
            return;
        }

        foreach (preg_split('/\s+/', $search) as $word) {
            $like = '%'.addcslashes($word, '%_\\').'%';

            $query->where(fn (Builder $match) => $match
                ->where('model', 'like', $like)
                ->orWhere('plate_number', 'like', $like)
                ->orWhereHas('brand', fn (Builder $brand) => $brand->where('name', 'like', $like)));
        }
    }

    private function byColumn(Builder $query, string $parameter, string $column): void
    {
        if (filled($this->filters[$parameter] ?? null)) {
            $query->where($column, $this->filters[$parameter]);
        }
    }

    /**
     * ?sort=price_per_day&direction=desc. Default: brand and model, A → Z.
     */
    private function sort(Builder $query): void
    {
        $sort = $this->filters['sort'] ?? 'name';
        $direction = ($this->filters['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        if ($sort === 'name') {
            $query->orderBy(Brand::select('name')->whereColumn('brands.id', 'cars.brand_id'), $direction)
                ->orderBy('model', $direction)
                ->orderBy('year', $direction);
        } else {
            $query->orderBy($sort, $direction);
        }

        $query->orderBy('id');
    }
}
