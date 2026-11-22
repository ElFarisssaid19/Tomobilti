<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
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
}
