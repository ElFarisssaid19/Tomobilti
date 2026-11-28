<?php

use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => config('app.name'),
        'version' => config('app.version'),
    ]);
});

// Public pages and bookable cars of the SPA (production routes the site's /sitemap.xml here).
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
