<?php

use App\Http\Controllers\Admin\PingController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\CurrentUserController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Catalog\CarAvailabilityController;
use App\Http\Controllers\Catalog\CarController;
use App\Http\Controllers\Catalog\CatalogFilterController;
use App\Http\Controllers\Catalog\CategoryController;
use App\Http\Controllers\Catalog\ExtraController;
use App\Http\Controllers\Catalog\FeaturedCarController;
use App\Http\Controllers\Catalog\LocationController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\Profile\PasswordController;
use App\Http\Controllers\Profile\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('api.health');

/*
|--------------------------------------------------------------------------
| Public catalogue and website (no authentication)
|--------------------------------------------------------------------------
|
| 60 requests per minute per visitor ("catalog" limiter, AppServiceProvider).
| Cars are found by slug; only cars with the "available" status are public.
| No endpoint exposes customers or reservation details.
|
*/

Route::middleware('throttle:catalog')->group(function () {
    Route::get('/cars', [CarController::class, 'index'])->name('cars.index');
    Route::get('/cars/featured', FeaturedCarController::class)->name('cars.featured');
    Route::get('/cars/{car}', [CarController::class, 'show'])->name('cars.show');
    Route::get('/cars/{car}/availability', CarAvailabilityController::class)->name('cars.availability');

    Route::get('/catalog/filters', CatalogFilterController::class)->name('catalog.filters');
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/locations', [LocationController::class, 'index'])->name('locations.index');
    Route::get('/extras', [ExtraController::class, 'index'])->name('extras.index');
});

// 3 messages per 10 minutes per IP address ("contact" limiter).
Route::post('/contact', [ContactController::class, 'store'])
    ->middleware('throttle:contact')
    ->name('contact.store');

/*
|--------------------------------------------------------------------------
| Authentication (Sanctum SPA cookies)
|--------------------------------------------------------------------------
|
| The SPA calls GET /sanctum/csrf-cookie first, then these JSON endpoints.
| Login has its own limiter (5 failed attempts per minute per email + IP,
| see LoginRequest); the other public endpoints allow 6 requests per minute.
| No "guest" middleware: it answers with a redirect, which an API must not
| do. The SPA keeps signed-in users away from these forms (GuestRoute).
|
*/

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/register', [RegisteredUserController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('register');

    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login');

    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.email');

    Route::post('/reset-password', [NewPasswordController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.store');

    // Signed link from the verification email (works with or without a session).
    Route::post('/email/verify/{id}/{hash}', VerifyEmailController::class)
        ->middleware('throttle:6,1')
        ->name('verification.verify');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
            ->middleware('throttle:6,1')
            ->name('verification.send');

        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', CurrentUserController::class)->name('user.show');

    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [PasswordController::class, 'update'])->name('profile.password.update');
});

/*
|--------------------------------------------------------------------------
| Admin area (auth:sanctum + admin): 401 for guests, 403 for clients
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/ping', PingController::class)->name('ping');
});
