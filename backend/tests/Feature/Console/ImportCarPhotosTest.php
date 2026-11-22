<?php

namespace Tests\Feature\Console;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Illuminate\Support\Str;
use Tests\TestCase;

class ImportCarPhotosTest extends TestCase
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
     * Temporary assets folder holding the given sources.json.
     *
     * @param  array<string, mixed>  $sources
     */
    private function assetsFolder(array $sources): string
    {
        $this->path = sys_get_temp_dir().'/tomobilti-car-photos-'.Str::random(8);
        File::ensureDirectoryExists($this->path);
        File::put("{$this->path}/sources.json", json_encode($sources));

        return $this->path;
    }

    private function jpeg(int $width, int $height): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagefilledrectangle($image, 0, 0, $width, $height, imagecolorallocate($image, 40, 90, 160));
        ob_start();
        imagejpeg($image);

        return (string) ob_get_clean();
    }

    /**
     * Commons API answer for one file with the given license.
     *
     * @return array<string, mixed>
     */
    private function commonsResponse(string $license, int $width = 4000): array
    {
        return ['query' => ['pages' => [[
            'title' => 'File:2024 Dacia Logan.jpg',
            'imageinfo' => [[
                'width' => $width,
                'url' => 'https://upload.wikimedia.org/original/logan.jpg',
                'thumburl' => 'https://upload.wikimedia.org/thumb/logan.jpg',
                'descriptionurl' => 'https://commons.wikimedia.org/wiki/File:2024_Dacia_Logan.jpg',
                'extmetadata' => [
                    'Artist' => ['value' => '<a href="//commons.wikimedia.org/wiki/User:Jane">Jane Doe</a>'],
                    'LicenseShortName' => ['value' => $license],
                    'LicenseUrl' => ['value' => 'https://creativecommons.org/licenses/by-sa/4.0'],
                ],
            ]],
        ]]]];
    }

    public function test_imports_a_commons_photo_as_two_cropped_webp_files_with_its_credits(): void
    {
        Sleep::fake();
        Http::preventStrayRequests();
        Http::fake([
            'commons.wikimedia.org/w/api.php*' => Http::response($this->commonsResponse('CC BY-SA 4.0')),
            'upload.wikimedia.org/thumb/logan.jpg' => Http::response($this->jpeg(2400, 1200)),
        ]);
        $path = $this->assetsFolder(['dacia-logan-2024' => [
            'label' => 'Dacia Logan 2024',
            'photos' => [[
                'commons' => 'File:2024 Dacia Logan.jpg',
                'view' => 'avant-trois-quarts',
                'blur' => [[0.4, 0.7, 0.2, 0.1]],
            ]],
        ]]);

        $this->artisan('tomobilti:import-car-photos', ['--path' => $path, '--no-credits' => true])
            ->assertSuccessful();

        $directory = "{$path}/dacia-logan-2024";
        $large = getimagesize("{$directory}/01-avant-trois-quarts-1600.webp");
        $thumbnail = getimagesize("{$directory}/01-avant-trois-quarts-800.webp");
        $this->assertSame([1600, 1000, 'image/webp'], [$large[0], $large[1], $large['mime']]);
        $this->assertSame([800, 500, 'image/webp'], [$thumbnail[0], $thumbnail[1], $thumbnail['mime']]);

        $manifest = json_decode(File::get("{$directory}/01-avant-trois-quarts.json"), true);
        $this->assertSame('Dacia Logan 2024', $manifest['model']);
        $this->assertSame('Jane Doe', $manifest['author']);
        $this->assertSame('CC BY-SA 4.0', $manifest['license']);
        $this->assertSame('https://creativecommons.org/licenses/by-sa/4.0', $manifest['license_url']);
        $this->assertSame('https://commons.wikimedia.org/wiki/File:2024_Dacia_Logan.jpg', $manifest['source_url']);
        $this->assertSame('Recadrée au format 16:10 et redimensionnée, convertie en WebP, plaque floutée', $manifest['changes']);
        $this->assertSame('CC BY-SA 4.0', $manifest['derivative_license']);
        Http::assertSent(fn (Request $request): bool => $request->hasHeader('User-Agent')
            && str_contains($request->header('User-Agent')[0], 'TomobiltiPhotoImporter'));
    }

    public function test_refuses_photos_under_a_non_commercial_license(): void
    {
        Sleep::fake();
        Http::preventStrayRequests();
        Http::fake([
            'commons.wikimedia.org/w/api.php*' => Http::response($this->commonsResponse('CC BY-NC-SA 4.0')),
        ]);
        $path = $this->assetsFolder(['dacia-logan-2024' => [
            'label' => 'Dacia Logan 2024',
            'photos' => [['commons' => 'File:2024 Dacia Logan.jpg', 'view' => 'avant-trois-quarts']],
        ]]);

        $this->artisan('tomobilti:import-car-photos', ['--path' => $path, '--no-credits' => true])
            ->expectsOutputToContain('Licence refusée')
            ->assertFailed();

        $this->assertSame([], File::glob("{$path}/dacia-logan-2024/*.webp"));
        Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), 'upload.wikimedia.org'));
    }

    public function test_refuses_commons_files_too_small_for_the_1600px_version(): void
    {
        Sleep::fake();
        Http::preventStrayRequests();
        Http::fake([
            'commons.wikimedia.org/w/api.php*' => Http::response($this->commonsResponse('CC BY-SA 4.0', width: 1500)),
        ]);
        $path = $this->assetsFolder(['dacia-logan-2024' => [
            'label' => 'Dacia Logan 2024',
            'photos' => [['commons' => 'File:2024 Dacia Logan.jpg', 'view' => 'avant-trois-quarts']],
        ]]);

        $this->artisan('tomobilti:import-car-photos', ['--path' => $path, '--no-credits' => true])
            ->expectsOutputToContain('Photo trop petite')
            ->assertFailed();

        Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), 'upload.wikimedia.org'));
    }

    public function test_keeps_existing_photos_unless_forced(): void
    {
        Sleep::fake();
        Http::preventStrayRequests();
        Http::fake([
            'images.pexels.com/*' => Http::response($this->jpeg(2000, 1250)),
        ]);
        $path = $this->assetsFolder(['kia-picanto-2024' => [
            'label' => 'Kia Picanto 2024',
            'photos' => [[
                'source' => 'Pexels',
                'url' => 'https://www.pexels.com/photo/1/',
                'download' => 'https://images.pexels.com/photos/1/photo.jpeg',
                'author' => 'Sara Alaoui',
                'license' => 'Pexels License',
                'view' => 'profil',
            ]],
        ]]);
        File::ensureDirectoryExists("{$path}/kia-picanto-2024");
        File::put("{$path}/kia-picanto-2024/01-profil.json", '{}');

        $this->artisan('tomobilti:import-car-photos', ['--path' => $path, '--no-credits' => true])->assertSuccessful();
        Http::assertNothingSent();

        $this->artisan('tomobilti:import-car-photos', ['--path' => $path, '--no-credits' => true, '--force' => true])
            ->assertSuccessful();
        Http::assertSentCount(1);
        $manifest = json_decode(File::get("{$path}/kia-picanto-2024/01-profil.json"), true);
        $this->assertSame('https://www.pexels.com/license/', $manifest['license_url']);
    }

    public function test_removes_files_that_are_no_longer_listed(): void
    {
        Sleep::fake();
        Http::preventStrayRequests();
        $path = $this->assetsFolder([
            'kia-picanto-2024' => ['label' => 'Kia Picanto 2024', 'photos' => [
                ['source' => 'Pexels', 'url' => 'u', 'download' => 'd', 'author' => 'A', 'license' => 'Pexels License', 'view' => 'profil'],
            ]],
            'fiat-ducato-2023' => ['label' => 'Fiat Ducato 2023', 'photos' => []],
        ]);
        File::ensureDirectoryExists("{$path}/kia-picanto-2024");
        File::put("{$path}/kia-picanto-2024/01-profil.json", '{}');
        File::put("{$path}/kia-picanto-2024/02-arriere-1600.webp", 'old');
        File::ensureDirectoryExists("{$path}/fiat-ducato-2023");
        File::put("{$path}/fiat-ducato-2023/01-avant.json", '{}');

        $this->artisan('tomobilti:import-car-photos', ['--path' => $path, '--no-credits' => true])->assertSuccessful();

        $this->assertFileExists("{$path}/kia-picanto-2024/01-profil.json");
        $this->assertFileDoesNotExist("{$path}/kia-picanto-2024/02-arriere-1600.webp");
        $this->assertDirectoryDoesNotExist("{$path}/fiat-ducato-2023");
    }
}
