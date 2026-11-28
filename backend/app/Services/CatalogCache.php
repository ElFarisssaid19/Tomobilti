<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Car;
use App\Models\Category;
use App\Models\Extra;
use App\Models\Location;
use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Cache of the public reference data that only the agency changes: the catalogue
 * filters, the categories, the agencies, the legal values and the sitemap. Every
 * write to a car, category, brand, agency or option (admin, seeder, scheduler) clears
 * all of it through the model events registered in AppServiceProvider, so a visitor
 * never sees stale counts; the TTL is only a safety net.
 *
 * Cache plain arrays (an API resource's `response()->getData(true)`), never resources:
 * `resolve()` leaves nested resources as objects, which a persistent store serializes.
 */
final class CatalogCache
{
    /**
     * Seconds before an entry expires even without a change.
     */
    public const TTL = 3600;

    /**
     * Every cached entry (cleared together).
     *
     * @var list<string>
     */
    public const KEYS = ['filters', 'categories', 'locations', 'legal', 'sitemap'];

    /**
     * Models whose writes clear the cache.
     *
     * @var list<class-string>
     */
    public const MODELS = [Car::class, Category::class, Brand::class, Location::class, Extra::class];

    /**
     * @template TValue
     *
     * @param  Closure(): TValue  $callback
     * @return TValue
     */
    public static function remember(string $key, Closure $callback): mixed
    {
        return Cache::remember(self::cacheKey($key), self::TTL, $callback);
    }

    public static function flush(): void
    {
        foreach (self::KEYS as $key) {
            Cache::forget(self::cacheKey($key));
        }
    }

    private static function cacheKey(string $key): string
    {
        return "catalog:{$key}";
    }
}
