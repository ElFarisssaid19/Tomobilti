<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
     * Public endpoints:
     * - "catalog": 60 requests per minute per visitor (cars, filters, locations...);
     * - "contact": 3 messages per 10 minutes per IP address, with a French message.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('catalog', fn (Request $request): Limit => Limit::perMinute(60)
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
