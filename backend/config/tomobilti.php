<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Agency
    |--------------------------------------------------------------------------
    |
    | Where the public contact form is delivered (POST /api/contact). In
    | development every email lands in Mailpit (http://localhost:8025).
    |
    */

    'agency' => [
        'email' => env('AGENCY_EMAIL', 'contact@tomobilti.ma'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Public catalogue
    |--------------------------------------------------------------------------
    */

    'catalog' => [
        // Cars per page of GET /api/cars.
        'per_page' => 12,

        // Similar cars on the detail page (same category).
        'similar_count' => 4,

        // Longest window of GET /api/cars/{slug}/availability, in months.
        'availability_max_months' => 6,
    ],

];
