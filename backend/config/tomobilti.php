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
    | Company (invoices and booking vouchers, Phase 6)
    |--------------------------------------------------------------------------
    |
    | Printed on every invoice and voucher. The legal identifiers below are
    | DEMO VALUES (all zeros): replace them with the agency's real ICE, RC, IF
    | and address through the env variables before going live.
    |
    */

    'company' => [
        'name' => env('COMPANY_NAME', 'Tomobilti SARL'),
        'address' => env('COMPANY_ADDRESS', '112, Avenue Mohammed V, Guéliz'),
        'city' => env('COMPANY_CITY', '40000 Marrakech, Maroc'),
        'phone' => env('COMPANY_PHONE', '+212 5 24 00 01 02'),
        'email' => env('COMPANY_EMAIL', 'contact@tomobilti.ma'),
        'website' => env('COMPANY_WEBSITE', 'tomobilti.ma'),
        'ice' => env('COMPANY_ICE', '000000000000000'),
        'rc' => env('COMPANY_RC', 'Marrakech 000000'),
        'if' => env('COMPANY_IF', '00000000'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Notifications (Phase 6)
    |--------------------------------------------------------------------------
    */

    'notifications' => [
        // The pick-up reminder goes out once, at most this many hours before pick-up
        // (reservations:send-reminders, every 15 minutes).
        'reminder_hours' => 24,

        // In-app notifications per page of GET /api/notifications.
        'per_page' => 15,
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

    /*
    |--------------------------------------------------------------------------
    | Booking rules (Phase 4)
    |--------------------------------------------------------------------------
    |
    | Read by the booking request, ReservationPricing, BookingEligibility and the
    | ReservationPolicy, and sent to the SPA by GET /api/booking-rules so the
    | booking form offers the same slots and limits. The server always checks
    | them again: the SPA only saves a round trip.
    |
    */

    'booking' => [
        // Pick-up and return times: from 08:00 to 20:00, every 30 minutes.
        'opening_time' => '08:00',
        'closing_time' => '20:00',
        'slot_minutes' => 30,

        // Earliest pick-up: 2 hours from now. Latest pick-up: 6 months ahead.
        'min_lead_hours' => 2,
        'max_advance_months' => 6,

        // Billed days: ceil(duration in hours / 24), from 1 to 30.
        'min_days' => 1,
        'max_days' => 30,

        // Driver: at least 21 years old, licence held for at least 2 years
        // (both checked on the pick-up date).
        'min_age' => 21,
        'min_license_years' => 2,

        // Free cancellation until 24 hours before pick-up.
        'free_cancellation_hours' => 24,

        // Fee (DH, TTC) when the car is returned to another agency.
        'one_way_fee' => '300.00',

        // Reservations per page of GET /api/reservations.
        'per_page' => 10,
    ],

];
