<?php

namespace Tests\Feature\Console;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Illuminate\Support\Str;
use Tests\TestCase;

class ImportSitePhotosTest extends TestCase
{
    private string $path;

    protected function tearDown(): void
    {
        if (isset($this->path)) {
            File::deleteDirectory($this->path);
        }

        parent::tearDown();
    }

    /**
     * @param  list<array<string, mixed>>  $sources
     */
    private function photosFolder(array $sources): string
    {
        $this->path = sys_get_temp_dir().'/tomobilti-site-photos-'.Str::random(8);
        File::ensureDirectoryExists($this->path);
        File::put("{$this->path}/sources.json", json_encode($sources));

        return $this->path;
    }

    private function jpeg(int $width, int $height): string
    {
        $image = imagecreatetruecolor($width, $height);
        ob_start();
        imagejpeg($image);

        return (string) ob_get_clean();
    }

    /**
     * @return array<string, mixed>
     */
    private function heroSource(string $license): array
    {
        return [
            'name' => 'hero',
            'description' => 'Voiture sur une route du Haut Atlas',
            'source' => 'Pexels',
            'url' => 'https://www.pexels.com/photo/570018/',
            'download' => 'https://images.pexels.com/photos/570018/photo.jpeg',
            'author' => 'Loubna Belmekki',
            'license' => $license,
            'variants' => [
                ['suffix' => '1920', 'width' => 1920, 'ratio' => '16:9', 'focus' => [0.6, 0.5]],
                ['suffix' => 'mobile', 'width' => 800, 'ratio' => '4:5', 'focus' => [0.7, 0.5]],
            ],
        ];
    }

    public function test_writes_one_webp_file_per_variant_and_a_manifest(): void
    {
        Sleep::fake();
        Http::preventStrayRequests();
        Http::fake(['images.pexels.com/*' => Http::response($this->jpeg(4000, 2600))]);
        $path = $this->photosFolder([$this->heroSource('Pexels License')]);

        $this->artisan('tomobilti:import-site-photos', ['--path' => $path, '--no-credits' => true])
            ->assertSuccessful();

        $this->assertSame([1920, 1080], array_slice(getimagesize("{$path}/hero-1920.webp"), 0, 2));
        $this->assertSame([800, 1000], array_slice(getimagesize("{$path}/hero-mobile.webp"), 0, 2));
        $manifest = json_decode(File::get("{$path}/hero.json"), true);
        $this->assertSame(['1920' => 'hero-1920.webp', 'mobile' => 'hero-mobile.webp'], $manifest['files']);
        $this->assertSame('Loubna Belmekki', $manifest['author']);
        $this->assertSame('https://www.pexels.com/license/', $manifest['license_url']);
        $this->assertSame('Recadrée et redimensionnée, convertie en WebP', $manifest['changes']);
        $this->assertNull($manifest['derivative_license']);
    }

    public function test_refuses_a_license_outside_the_allow_list(): void
    {
        Sleep::fake();
        Http::preventStrayRequests();
        $path = $this->photosFolder([$this->heroSource('Tous droits réservés')]);

        $this->artisan('tomobilti:import-site-photos', ['--path' => $path, '--no-credits' => true])
            ->expectsOutputToContain('Licence refusée')
            ->assertFailed();

        $this->assertFileDoesNotExist("{$path}/hero.json");
        Http::assertNothingSent();
    }
}
