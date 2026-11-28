<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Services\CatalogCache;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Public pages of the SPA listed in the sitemap, with their change frequency.
     *
     * @var array<string, string>
     */
    private const PAGES = [
        '/' => 'daily',
        '/voitures' => 'daily',
        '/a-propos' => 'monthly',
        '/contact' => 'monthly',
        '/conditions-generales' => 'yearly',
        '/confidentialite' => 'yearly',
        '/credits' => 'yearly',
    ];

    /**
     * GET /sitemap.xml: the public pages and every car that can be booked, with URLs on
     * the SPA (FRONTEND_URL). Generated here so a new car appears at once; cached with
     * the catalogue and cleared on any car change (CatalogCache). In production the web
     * server routes the site's /sitemap.xml to this endpoint.
     */
    public function __invoke(): Response
    {
        $xml = CatalogCache::remember('sitemap', fn (): string => view('sitemap', [
            'site' => rtrim(explode(',', (string) config('app.frontend_url'))[0], '/'),
            'pages' => self::PAGES,
            'cars' => Car::query()->available()->orderBy('slug')->get(['slug', 'updated_at']),
        ])->render());

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
