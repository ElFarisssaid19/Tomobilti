<?php

use App\Exceptions\ApiExceptionRenderer;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\ForceJsonResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

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

        // Route::middleware(['auth:sanctum', 'admin']): administrators only (403 otherwise).
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Every api/* response is JSON, including 404, 401, 403, 422 and 500.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => ApiExceptionRenderer::shouldRender($request),
        );

        $exceptions->render(new ApiExceptionRenderer);
    })->create();
