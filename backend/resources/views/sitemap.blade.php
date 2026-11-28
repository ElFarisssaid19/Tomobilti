{!! '<?xml version="1.0" encoding="UTF-8"?>' !!}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
@foreach ($pages as $path => $frequency)
    <url>
        <loc>{{ $site.$path }}</loc>
        <changefreq>{{ $frequency }}</changefreq>
    </url>
@endforeach
@foreach ($cars as $car)
    <url>
        <loc>{{ $site }}/voitures/{{ $car->slug }}</loc>
        <lastmod>{{ $car->updated_at->toDateString() }}</lastmod>
        <changefreq>weekly</changefreq>
    </url>
@endforeach
</urlset>
