<?php

namespace Tests\Feature;

use App\Models\Car;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_the_public_pages_and_every_bookable_car_on_the_spa(): void
    {
        config(['app.frontend_url' => 'https://tomobilti.ma']);
        $car = Car::factory()->create(['slug' => 'dacia-logan-2024']);
        Car::factory()->maintenance()->create(['slug' => 'kia-picanto-2023']);

        $response = $this->get('/sitemap.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

        $xml = simplexml_load_string($response->getContent());
        $urls = array_map(fn ($url) => (string) $url->loc, iterator_to_array($xml->url, false));
        $this->assertContains('https://tomobilti.ma/', $urls);
        $this->assertContains('https://tomobilti.ma/conditions-generales', $urls);
        $this->assertContains('https://tomobilti.ma/voitures/dacia-logan-2024', $urls);
        $this->assertNotContains('https://tomobilti.ma/voitures/kia-picanto-2023', $urls);

        // A new car appears at once (the cached sitemap is cleared).
        Car::factory()->create(['slug' => 'renault-clio-5-2025']);
        $this->assertStringContainsString('/voitures/renault-clio-5-2025', $this->get('/sitemap.xml')->getContent());
        $this->assertStringContainsString($car->updated_at->toDateString(), $response->getContent());
    }
}
