<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security headers on every response of the API (JSON, PDFs, CSV, the sitemap). The
 * API never serves a page to display: nothing may frame it, it loads nothing, and the
 * browser must not guess another content type. The SPA's own Content-Security-Policy is
 * set by the web server that serves it (docs/security.md).
 */
class SecurityHeaders
{
    /**
     * @var array<string, string>
     */
    public const HEADERS = [
        'X-Content-Type-Options' => 'nosniff',
        'X-Frame-Options' => 'DENY',
        'Referrer-Policy' => 'strict-origin-when-cross-origin',
        'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        'Permissions-Policy' => 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
        'Cross-Origin-Opener-Policy' => 'same-origin',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // A PDF opened in a tab is shown by the browser's viewer, which "default-src 'none'"
        // would block: PDFs get every header but the CSP.
        $isPdf = str_starts_with((string) $response->headers->get('Content-Type'), 'application/pdf');

        foreach (self::HEADERS as $name => $value) {
            if ($isPdf && $name === 'Content-Security-Policy') {
                continue;
            }

            $response->headers->set($name, $value, replace: false);
        }

        // HTTPS only: tell browsers to never use plain HTTP for a year.
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains', replace: false);
        }

        return $response;
    }
}
