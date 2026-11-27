<?php

use App\Http\Controllers\Admin\CarController as AdminCarController;
use App\Http\Controllers\Admin\CarImageController;
use App\Http\Controllers\Admin\CarStatusController;
use App\Http\Controllers\Admin\ClientActivationController;
use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InvoiceController as AdminInvoiceController;
use App\Http\Controllers\Admin\PingController;
use App\Http\Controllers\Admin\PlanningController;
use App\Http\Controllers\Admin\ReservationActionController;
use App\Http\Controllers\Admin\ReservationController as AdminReservationController;
use App\Http\Controllers\Admin\Settings\BrandController as AdminBrandController;
use App\Http\Controllers\Admin\Settings\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\Settings\ExtraController as AdminExtraController;
use App\Http\Controllers\Admin\Settings\LocationController as AdminLocationController;
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
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Profile\PasswordController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Reservation\BookingRulesController;
use App\Http\Controllers\Reservation\CancelReservationController;
use App\Http\Controllers\Reservation\ReservationController;
use App\Http\Controllers\Reservation\ReservationDocumentController;
use App\Http\Controllers\Reservation\ReservationQuoteController;
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
| see LoginRequest) plus 20 attempts per minute per IP, so one address cannot try
| many accounts; the other public endpoints allow 6 requests per minute.
| No "guest" middleware: it answers with a redirect, which an API must not
| do. The SPA keeps signed-in users away from these forms (GuestRoute).
|
*/

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/register', [RegisteredUserController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('register');

    Route::post('/login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:20,1')
        ->name('login');

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
    // Guessing the current password from a signed-in session: 6 tries per minute.
    Route::put('/profile/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('profile.password.update');

    // The bell (Phase 6): in-app notifications of the signed-in user, customer or admin.
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'read'])->whereUuid('id')->name('notifications.read');
});

/*
|--------------------------------------------------------------------------
| Reservations (Phase 4)
|--------------------------------------------------------------------------
|
| The quote and the booking rules are public ("booking" limiter: 120 requests
| per minute, the booking summary asks for a new quote when a choice changes).
| The quote adds the eligibility of a signed-in customer. Booking needs a
| verified email; a customer only ever reaches their own reservations (the
| ReservationPolicy answers 404 for anyone else's).
|
*/

Route::middleware('throttle:booking')->group(function () {
    Route::get('/booking-rules', BookingRulesController::class)->name('booking.rules');
    Route::post('/reservations/quote', ReservationQuoteController::class)->name('reservations.quote');
});

Route::prefix('reservations')->name('reservations.')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [ReservationController::class, 'index'])->name('index');
    Route::post('/', [ReservationController::class, 'store'])
        ->middleware(['verified', 'throttle:10,1'])
        ->name('store');
    Route::get('/{reservation:reference}', [ReservationController::class, 'show'])->name('show');
    Route::post('/{reservation:reference}/cancel', CancelReservationController::class)->name('cancel');
    Route::get('/{reservation:reference}/voucher', [ReservationDocumentController::class, 'voucher'])->name('voucher');
    Route::get('/{reservation:reference}/invoice', [ReservationDocumentController::class, 'invoice'])->name('invoice');
});

/*
|--------------------------------------------------------------------------
| Admin area (auth:sanctum + admin): 401 for guests, 403 for clients
|--------------------------------------------------------------------------
|
| Every action also checks its policy (app/Policies). Cars and catalogue settings
| are found by id here (slugs are for public URLs), reservations by reference.
| Removed (soft deleted) cars stay reachable, so they can be viewed and restored.
|
*/

Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/ping', PingController::class)->name('ping');
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/planning', PlanningController::class)->name('planning');

    Route::prefix('cars')->name('cars.')->group(function () {
        Route::get('/', [AdminCarController::class, 'index'])->name('index');
        Route::post('/', [AdminCarController::class, 'store'])->name('store');

        Route::withoutScopedBindings()->group(function () {
            Route::get('/{car:id}', [AdminCarController::class, 'show'])->withTrashed()->name('show');
            Route::put('/{car:id}', [AdminCarController::class, 'update'])->withTrashed()->name('update');
            Route::delete('/{car:id}', [AdminCarController::class, 'destroy'])->name('destroy');
            Route::post('/{car:id}/restore', [AdminCarController::class, 'restore'])->withTrashed()->name('restore');
            Route::get('/{car:id}/status-conflicts', [CarStatusController::class, 'conflicts'])->withTrashed()->name('status.conflicts');
            Route::patch('/{car:id}/status', [CarStatusController::class, 'update'])->withTrashed()->name('status.update');
        });

        Route::post('/{car:id}/images', [CarImageController::class, 'store'])->withTrashed()->name('images.store');
        Route::put('/{car:id}/images/order', [CarImageController::class, 'reorder'])->withTrashed()->name('images.reorder');
        Route::scopeBindings()->group(function () {
            Route::patch('/{car:id}/images/{image}', [CarImageController::class, 'update'])->withTrashed()->name('images.update');
            Route::delete('/{car:id}/images/{image}', [CarImageController::class, 'destroy'])->withTrashed()->name('images.destroy');
        });
    });

    Route::prefix('reservations')->name('reservations.')->group(function () {
        Route::get('/', [AdminReservationController::class, 'index'])->name('index');
        Route::get('/export', [AdminReservationController::class, 'export'])->name('export');
        Route::get('/{reservation:reference}', [AdminReservationController::class, 'show'])->name('show');
        Route::get('/{reservation:reference}/voucher', [AdminReservationController::class, 'voucher'])->name('voucher');
        Route::post('/{reservation:reference}/confirm', [ReservationActionController::class, 'confirm'])->name('confirm');
        Route::post('/{reservation:reference}/reject', [ReservationActionController::class, 'reject'])->name('reject');
        Route::post('/{reservation:reference}/pick-up', [ReservationActionController::class, 'pickUp'])->name('pick-up');
        Route::post('/{reservation:reference}/return', [ReservationActionController::class, 'return'])->name('return');
        Route::post('/{reservation:reference}/cancel', [ReservationActionController::class, 'cancel'])->name('cancel');
        Route::patch('/{reservation:reference}/notes', [ReservationActionController::class, 'notes'])->name('notes');
    });

    Route::prefix('invoices')->name('invoices.')->group(function () {
        Route::get('/', [AdminInvoiceController::class, 'index'])->name('index');
        Route::get('/{invoice:number}/pdf', [AdminInvoiceController::class, 'pdf'])->name('pdf');
        Route::post('/{invoice:number}/mark-paid', [AdminInvoiceController::class, 'markPaid'])->name('mark-paid');
        Route::post('/{invoice:number}/send', [AdminInvoiceController::class, 'send'])->name('send');
    });

    Route::prefix('clients')->name('clients.')->group(function () {
        Route::get('/', [ClientController::class, 'index'])->name('index');
        Route::get('/{client}', [ClientController::class, 'show'])->name('show');
        Route::post('/{client}/activate', [ClientActivationController::class, 'activate'])->name('activate');
        Route::post('/{client}/deactivate', [ClientActivationController::class, 'deactivate'])->name('deactivate');
    });

    Route::apiResource('categories', AdminCategoryController::class)->except('show')->parameters(['categories' => 'category:id']);
    Route::apiResource('brands', AdminBrandController::class)->except('show')->parameters(['brands' => 'brand:id']);
    Route::apiResource('locations', AdminLocationController::class)->except('show')->parameters(['locations' => 'location:id']);
    Route::apiResource('extras', AdminExtraController::class)->except('show')->parameters(['extras' => 'extra:id']);
});
