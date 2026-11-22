<?php

namespace App\Console\Commands;

use App\Console\Commands\Concerns\ProcessesPhotos;
use App\Models\CarImage;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * Downloads the demo car photos listed in `sources.json`, crops them to 16:10 around
 * the car, and stores 1600px + 800px WebP files with one JSON manifest per photo
 * (source, author, license) in database/seeders/assets/cars/{car-slug}/.
 *
 * Existing photos are kept unless --force is given, so the command is cheap to re-run
 * after adding a source. The CarSeeder then copies these files to the public disk.
 */
#[Signature('tomobilti:import-car-photos
    {--only=* : Only these car slugs (repeatable)}
    {--force : Download and process again photos that already exist}
    {--path= : Folder holding sources.json and the car folders (default: database/seeders/assets/cars)}
    {--no-credits : Do not regenerate docs/image-credits.md and the frontend credits file}')]
#[Description('Download, crop and optimize the demo car photos (WebP 1600 + 800 px) with their credits')]
class ImportCarPhotos extends Command
{
    use ProcessesPhotos;

    /**
     * Ratio of every car photo (cards and detail page).
     */
    public const RATIO = '16:10';

    /**
     * Above this total size the command warns: the files are committed to git.
     */
    public const SIZE_BUDGET_BYTES = 25 * 1024 * 1024;

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $path = $this->option('path') ?: database_path('seeders/assets/cars');
        $sources = $this->readJson("{$path}/sources.json");
        $only = $this->option('only');
        $failures = 0;

        foreach ($sources as $slug => $car) {
            if ($only !== [] && ! in_array($slug, $only, true)) {
                continue;
            }

            $failures += $this->importCar($path, $slug, $car);
        }

        $total = collect(File::allFiles($path))
            ->filter(fn ($file): bool => $file->getExtension() === 'webp')
            ->sum(fn ($file): int => $file->getSize());

        $this->components->info("Photos de voitures : {$this->formatBytes($total)} au total.");

        if ($total > self::SIZE_BUDGET_BYTES) {
            $this->components->warn('Le total dépasse '.$this->formatBytes(self::SIZE_BUDGET_BYTES).' : réduisez le nombre de photos.');
        }

        if (! $this->option('no-credits')) {
            $this->call('tomobilti:image-credits');
        }

        return $failures === 0 ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Process every photo of one car and remove files that are no longer listed.
     *
     * @param  array{label: string, note?: string, photos: list<array<string, mixed>>}  $car
     * @return int number of photos that failed
     */
    private function importCar(string $path, string $slug, array $car): int
    {
        $directory = "{$path}/{$slug}";
        $photos = $car['photos'] ?? [];

        if ($photos === []) {
            File::deleteDirectory($directory);
            $this->components->twoColumnDetail($slug, '<fg=yellow>placeholder SVG</>');

            return 0;
        }

        File::ensureDirectoryExists($directory);
        $expected = [];
        $failures = 0;

        foreach ($photos as $index => $photo) {
            $name = sprintf('%02d-%s', $index + 1, $photo['view']);
            $expected[] = "{$name}.json";
            $expected[] = "{$name}-".CarImage::LARGE_WIDTH.'.webp';
            $expected[] = "{$name}-".CarImage::THUMBNAIL_WIDTH.'.webp';

            if (! $this->option('force') && File::exists("{$directory}/{$name}.json")) {
                continue;
            }

            try {
                $this->importPhoto($directory, $name, $slug, $car, $photo);
                $this->components->twoColumnDetail("{$slug}/{$name}", '<fg=green>OK</>');
            } catch (Throwable $exception) {
                $failures++;
                $this->components->error("{$slug}/{$name} : {$exception->getMessage()}");
            }
        }

        foreach (File::files($directory) as $file) {
            if (! in_array($file->getFilename(), $expected, true)) {
                File::delete($file->getPathname());
            }
        }

        return $failures;
    }

    /**
     * @param  array{label: string, note?: string}  $car
     * @param  array<string, mixed>  $photo
     */
    private function importPhoto(string $directory, string $name, string $slug, array $car, array $photo): void
    {
        $origin = isset($photo['commons'])
            ? $this->commonsPhoto($photo['commons'])
            : [
                'source' => $photo['source'],
                'title' => $photo['title'] ?? '',
                'source_url' => $photo['url'],
                'download_url' => $photo['download'],
                'author' => $photo['author'],
                'author_url' => $photo['author_url'] ?? null,
                'license' => $this->assertAllowedLicense($photo['license'], $photo['url']),
                'license_url' => $photo['license_url'] ?? $this->knownLicenseUrl($photo['license']),
            ];

        $variant = [
            'ratio' => $this->parseRatio(self::RATIO),
            'focus' => $photo['focus'] ?? [0.5, 0.5],
            'zoom' => $photo['zoom'] ?? 1.0,
        ];

        $files = $this->renderVariants($this->downloadPhoto($origin['download_url']), [
            ['suffix' => (string) CarImage::LARGE_WIDTH, 'width' => CarImage::LARGE_WIDTH, ...$variant],
            ['suffix' => (string) CarImage::THUMBNAIL_WIDTH, 'width' => CarImage::THUMBNAIL_WIDTH, ...$variant],
        ], $photo['blur'] ?? []);

        foreach ($files as $suffix => $bytes) {
            File::put("{$directory}/{$name}-{$suffix}.webp", $bytes);
        }

        $this->writeJson("{$directory}/{$name}.json", [
            'file' => $name,
            'car' => $slug,
            'model' => $car['label'],
            'view' => $photo['view'],
            'files' => [
                (string) CarImage::LARGE_WIDTH => "{$name}-".CarImage::LARGE_WIDTH.'.webp',
                (string) CarImage::THUMBNAIL_WIDTH => "{$name}-".CarImage::THUMBNAIL_WIDTH.'.webp',
            ],
            'source' => $origin['source'],
            'title' => $origin['title'],
            'source_url' => $origin['source_url'],
            'author' => $origin['author'],
            'author_url' => $origin['author_url'],
            'license' => $origin['license'],
            'license_url' => $origin['license_url'],
            'changes' => $this->describeChanges(self::RATIO, plateBlurred: isset($photo['blur'])),
            'derivative_license' => $this->derivativeLicense($origin['license']),
            'note' => $photo['note'] ?? $car['note'] ?? null,
        ]);
    }
}
