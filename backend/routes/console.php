<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled tasks
|--------------------------------------------------------------------------
|
| In development, `npm run dev` runs `php artisan schedule:work`. In
| production, run `php artisan schedule:run` every minute (cron).
|
*/

// Pending requests whose pick-up time has passed are refused ("Demande expirée").
Schedule::command('reservations:expire')->everyFiveMinutes()->withoutOverlapping(10);

// Pick-up reminder, once per confirmed reservation, less than 24 hours before pick-up.
Schedule::command('reservations:send-reminders')->everyFifteenMinutes()->withoutOverlapping(10);
