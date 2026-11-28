<?php

namespace App\Providers;

use App\Models\User;
use App\Services\CatalogCache;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configurePasswordRules();
        $this->configureAuthorization();
        $this->configureRateLimiting();
        $this->clearCatalogCacheOnChanges();
    }

    /**
     * Any write to a car, category, brand, agency or option clears the cached public
     * reference data (filters, categories, agencies, legal values, sitemap). Restoring a
     * soft deleted car saves it, so "saved" covers it. The cache is cleared once the
     * transaction commits (at once outside one), so a request running meanwhile cannot
     * cache the old state again.
     */
    private function clearCatalogCacheOnChanges(): void
    {
        $flush = fn () => DB::afterCommit(fn () => CatalogCache::flush());

        foreach (CatalogCache::MODELS as $model) {
            $model::saved($flush);
            $model::deleted($flush);
        }
    }

    /**
     * Password rule shared by registration, reset and password change:
     * at least 8 characters with letters and numbers.
     */
    private function configurePasswordRules(): void
    {
        Password::defaults(fn (): Password => Password::min(8)->letters()->numbers());
    }

    /**
     * Authorization base. "access-admin" protects the whole admin area (see the
     * "admin" middleware). Model policies (app/Policies) are discovered
     * automatically when the next phases add them.
     */
    private function configureAuthorization(): void
    {
        Gate::define('access-admin', fn (User $user): bool => $user->isAdmin());
    }

    /**
     * Every route: "api" (300 requests per minute per user or IP) and "web" (120 per
     * minute per IP: CSRF cookie, sitemap), a safety net under the limiters below.
     *
     * Public endpoints:
     * - "session": 60 per minute (GET /api/auth/session, on every start of the SPA);
     * - "catalog": 60 requests per minute per visitor (cars, filters, locations...);
     * - "contact": 3 messages per 10 minutes per IP address, with a French message;
     * - "booking": 120 requests per minute (quotes refresh while the customer chooses).
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('api', fn (Request $request): Limit => Limit::perMinute(300)
            ->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('web', fn (Request $request): Limit => Limit::perMinute(120)
            ->by($request->ip()));

        RateLimiter::for('session', fn (Request $request): Limit => Limit::perMinute(60)
            ->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('catalog', fn (Request $request): Limit => Limit::perMinute(60)
            ->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('booking', fn (Request $request): Limit => Limit::perMinute(120)
            ->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('contact', fn (Request $request): Limit => Limit::perMinutes(10, 3)
            ->by($request->ip())
            ->response(fn (Request $request, array $headers) => response()->json(
                ['message' => __('api.contact.throttled', ['minutes' => (int) ceil(($headers['Retry-After'] ?? 60) / 60)])],
                429,
                $headers,
            )));
    }
}
