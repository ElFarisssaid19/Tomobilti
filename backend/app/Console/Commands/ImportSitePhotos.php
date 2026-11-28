<?php

namespace App\Console\Commands;

use App\Console\Commands\Concerns\ProcessesPhotos;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * Downloads the public site photos (hero, future sections) listed in
 * frontend/src/assets/photos/sources.json and writes optimized WebP crops plus one
 * JSON manifest per photo next to it. The frontend imports the WebP files directly.
 *
 * Each variant may list its own plate `blur` regions (fractions of that crop), since
 * a 16:9 and a 4:5 crop of the same photo put the plate in different places.
 *
 * The SPA lives in the same repository: this command is the PHP image pipeline for
 * both apps, so no image tool with install scripts is needed on the frontend side.
 */
#[Signature('tomobilti:import-site-photos
    {--only=* : Only these photo names (repeatable)}
    {--force : Download and process again photos that already exist}
    {--path= : Folder holding sources.json (default: ../frontend/src/assets/photos)}
    {--no-credits : Do not regenerate docs/image-credits.md and the frontend credits file}')]
#[Description('Download, crop and optimize the public site photos (WebP) with their credits')]
class ImportSitePhotos extends Command
{
    use ProcessesPhotos;

    /**
     * Crops used when a source does not list its own variants.
     *
     * @var list<array{suffix: string, width: int, ratio: string}>
     */
    private const DEFAULT_VARIANTS = [
        ['suffix' => '1600', 'width' => 1600, 'ratio' => '16:9'],
        ['suffix' => '800', 'width' => 800, 'ratio' => '16:9'],
    ];

    /**
     * Budget of each generated file (about 150 KB): the quality goes down until it fits.
     */
    private const MAX_BYTES = 150 * 1024;

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $path = $this->option('path') ?: base_path('../frontend/src/assets/photos');
        $only = $this->option('only');
        $failures = 0;

        foreach ($this->readJson("{$path}/sources.json") as $photo) {
            $name = $photo['name'];

            if (($only !== [] && ! in_array($name, $only, true))
                || (! $this->option('force') && File::exists("{$path}/{$name}.json"))) {
                continue;
            }

            try {
                $this->importPhoto($path, $photo);
                $this->components->twoColumnDetail($name, '<fg=green>OK</>');
            } catch (Throwable $exception) {
                $failures++;
                $this->components->error("{$name} : {$exception->getMessage()}");
            }
        }

        if (! $this->option('no-credits')) {
            $this->call('tomobilti:image-credits');
        }

        return $failures === 0 ? self::SUCCESS : self::FAILURE;
    }

    /**
     * @param  array<string, mixed>  $photo
     */
    private function importPhoto(string $path, array $photo): void
    {
        $license = $this->assertAllowedLicense($photo['license'], $photo['url']);
        $variants = array_map(fn (array $variant): array => [
            'suffix' => $variant['suffix'],
            'width' => $variant['width'],
            'ratio' => $this->parseRatio($variant['ratio']),
            'focus' => $variant['focus'] ?? [0.5, 0.5],
            'zoom' => $variant['zoom'] ?? 1.0,
            ...(isset($variant['blur']) ? ['blur' => $variant['blur']] : []),
            'max_bytes' => self::MAX_BYTES,
        ], $photo['variants'] ?? self::DEFAULT_VARIANTS);
        $plateBlurred = isset($photo['blur']) || array_filter($variants, fn (array $variant): bool => isset($variant['blur'])) !== [];

        $files = $this->renderVariants($this->downloadPhoto($photo['download']), $variants, $photo['blur'] ?? []);
        $names = [];

        foreach ($files as $suffix => $bytes) {
            $names[$suffix] = "{$photo['name']}-{$suffix}.webp";
            File::put("{$path}/{$names[$suffix]}", $bytes);
        }

        $this->writeJson("{$path}/{$photo['name']}.json", [
            'file' => $photo['name'],
            'description' => $photo['description'],
            'files' => $names,
            'source' => $photo['source'],
            'title' => $photo['title'] ?? '',
            'source_url' => $photo['url'],
            'author' => $photo['author'],
            'author_url' => $photo['author_url'] ?? null,
            'license' => $license,
            'license_url' => $photo['license_url'] ?? $this->knownLicenseUrl($license),
            'changes' => $this->describeChanges(plateBlurred: $plateBlurred),
            'derivative_license' => $this->derivativeLicense($license),
        ]);
    }
}
