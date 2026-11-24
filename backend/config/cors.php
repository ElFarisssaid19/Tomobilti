<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The React SPA (FRONTEND_URL) calls this API with cookies (Sanctum SPA
    | authentication), so the origin must be explicit (no "*") and
    | credentials must be supported.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    // Every auth endpoint lives under api/auth/*, so these two paths cover the SPA.
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(array_map(
        'trim',
        explode(',', (string) env('FRONTEND_URL', 'http://localhost:5173')),
    )),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    // The SPA reads the file name of downloads (CSV export of the back office).
    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    'supports_credentials' => true,

];
