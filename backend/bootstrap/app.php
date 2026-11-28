<?php

use App\Exceptions\ApiExceptionRenderer;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Routing\Middleware\ThrottleRequests;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA authentication: requests coming from SANCTUM_STATEFUL_DOMAINS
        // get session + CSRF protection on the api routes.
        $middleware->statefulApi();

        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        // A safety net on every route ("api" and "web" limiters, AppServiceProvider), on
        // top of the stricter limiters of login, registration, contact, catalogue...
        $middleware->throttleApi();
        $middleware->web(append: [ThrottleRequests::class.':web']);

        // Every response (api, sitemap, CSRF cookie, errors): nosniff, no framing, CSP...
        $middleware->append(SecurityHeaders::class);

        // Route::middleware(['auth:sanctum', 'admin']): administrators only (403 otherwise).
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);

        // Check the role before route model binding, so a client gets the same 403
        // for an existing and a missing admin resource (no existence probing).
        $middleware->prependToPriorityList(SubstituteBindings::class, EnsureUserIsAdmin::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Every api/* response is JSON, including 404, 401, 403, 422 and 500.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => ApiExceptionRenderer::shouldRender($request),
        );

        $exceptions->render(new ApiExceptionRenderer);
    })->create();
