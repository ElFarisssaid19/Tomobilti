<?php

namespace App\Console\Commands\Concerns;

use GdImage;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use RuntimeException;
use Throwable;

/**
 * Shared logic of the photo import commands: download photos politely, read their
 * author and license, crop them around the subject and save optimized WebP files.
 *
 * Images are processed with GD only (no npm or PHP image dependency). GD never writes
 * EXIF or other metadata, so the WebP files are stripped by construction.
 */
trait ProcessesPhotos
{
    /**
     * Wikimedia asks automated clients for an identifying User-Agent.
     */
    protected const USER_AGENT = 'TomobiltiPhotoImporter/1.0 (educational car-rental demo project; Laravel HTTP client)';

    /**
     * Width of the Commons thumbnail to download: a standard Wikimedia size (served from
     * the thumbnail cache), large enough for the 1600px output. Originals are rate limited.
     */
    protected const COMMONS_DOWNLOAD_WIDTH = 1920;

    /**
     * WebP quality of every generated file.
     */
    protected const WEBP_QUALITY = 80;

    /**
     * Licenses that allow reuse in a public project. NC and ND licenses are refused.
     */
    protected const ALLOWED_LICENSE_PATTERN = '/^(CC0|Public domain|PD\b|CC BY(-SA)? \d|Pexels License|Unsplash License)/i';

    /**
     * License URLs for licenses that Wikimedia does not always link.
     *
     * @var array<string, string>
     */
    protected const KNOWN_LICENSE_URLS = [
        'CC0' => 'https://creativecommons.org/publicdomain/zero/1.0/',
        'Public domain' => 'https://en.wikipedia.org/wiki/Public_domain',
        'Pexels License' => 'https://www.pexels.com/license/',
        'Unsplash License' => 'https://unsplash.com/license',
    ];

    /**
     * HTTP client for photo sources: explicit timeouts, retries on rate limits and
     * server errors only (every request is an idempotent GET).
     */
    protected function photoClient(): PendingRequest
    {
        return Http::withUserAgent(self::USER_AGENT)
            ->connectTimeout(10)
            ->timeout(90)
            ->retry([2000, 5000, 15000, 30000], 0, function (Throwable $exception): bool {
                return $exception instanceof ConnectionException
                    || ($exception instanceof RequestException
                        && ($exception->response->serverError() || $exception->response->status() === 429));
            });
    }

    /**
     * Author, license and download URL of a Wikimedia Commons file, from its API.
     *
     * @return array{source: string, title: string, source_url: string, download_url: string, author: string, author_url: null, license: string, license_url: string}
     */
    protected function commonsPhoto(string $fileTitle): array
    {
        Sleep::for(1)->second();

        $response = $this->photoClient()->get('https://commons.wikimedia.org/w/api.php', [
            'action' => 'query',
            'titles' => $fileTitle,
            'prop' => 'imageinfo',
            'iiprop' => 'url|size|extmetadata',
            'iiurlwidth' => self::COMMONS_DOWNLOAD_WIDTH,
            'iiextmetadatafilter' => 'Artist|LicenseShortName|LicenseUrl',
            'format' => 'json',
            'formatversion' => 2,
        ])->throw()->json();

        $info = data_get($response, 'query.pages.0.imageinfo.0');

        if (! is_array($info)) {
            throw new RuntimeException("Fichier introuvable sur Wikimedia Commons : {$fileTitle}");
        }

        if (($info['width'] ?? 0) < self::COMMONS_DOWNLOAD_WIDTH) {
            throw new RuntimeException(sprintf(
                'Photo trop petite (%d px de large, minimum %d) : %s',
                $info['width'] ?? 0,
                self::COMMONS_DOWNLOAD_WIDTH,
                $fileTitle,
            ));
        }

        $license = trim((string) data_get($info, 'extmetadata.LicenseShortName.value'));

        return [
            'source' => 'Wikimedia Commons',
            'title' => $fileTitle,
            'source_url' => $info['descriptionurl'],
            'download_url' => $info['thumburl'] ?? $info['url'],
            'author' => $this->plainText((string) data_get($info, 'extmetadata.Artist.value', 'Inconnu')),
            'author_url' => null,
            'license' => $this->assertAllowedLicense($license, $fileTitle),
            'license_url' => data_get($info, 'extmetadata.LicenseUrl.value') ?: $this->knownLicenseUrl($license),
        ];
    }

    /**
     * Download the raw bytes of a photo.
     */
    protected function downloadPhoto(string $url): string
    {
        Sleep::for(1)->second();

        return $this->photoClient()->get($url)->throw()->body();
    }

    /**
     * Refuse any license outside the allow-list (no NC, no ND, no "all rights reserved").
     */
    protected function assertAllowedLicense(string $license, string $title): string
    {
        if (! preg_match(self::ALLOWED_LICENSE_PATTERN, $license) || preg_match('/\b(NC|ND)\b/', $license)) {
            throw new RuntimeException("Licence refusée pour {$title} : « {$license} »");
        }

        return $license;
    }

    /**
     * The changes made to a photo, in French, as CC BY and CC BY-SA ask to indicate them.
     */
    protected function describeChanges(?string $ratio = null, bool $plateBlurred = false): string
    {
        $changes = $ratio
            ? "Recadrée au format {$ratio} et redimensionnée, convertie en WebP"
            : 'Recadrée et redimensionnée, convertie en WebP';

        return $plateBlurred ? "{$changes}, plaque floutée" : $changes;
    }

    /**
     * The license our modified version is shared under: the same one for ShareAlike
     * licenses (CC BY-SA), none to state for the others.
     */
    protected function derivativeLicense(string $license): ?string
    {
        return preg_match('/\bBY-SA\b/i', $license) ? $license : null;
    }

    protected function knownLicenseUrl(string $license): string
    {
        foreach (self::KNOWN_LICENSE_URLS as $prefix => $url) {
            if (str_starts_with($license, $prefix)) {
                return $url;
            }
        }

        return '';
    }

    /**
     * Wikimedia "Artist" values are HTML (links to user pages): keep the visible name.
     */
    protected function plainText(string $html): string
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/^User:/', '', trim((string) preg_replace('/\s+/', ' ', $text)));

        return $text !== '' ? $text : 'Inconnu';
    }

    /**
     * Crop the photo to each variant's ratio around a focus point, resize it and encode
     * it as WebP.
     *
     * @param  list<array{suffix: string, width: int, ratio: float, focus?: array{0: float, 1: float}, zoom?: float}>  $variants
     * @param  list<array{0: float, 1: float, 2: float, 3: float}>  $blurRegions  [x, y, width, height] as fractions of the cropped output (same for every variant)
     * @return array<string, string> WebP bytes keyed by variant suffix
     */
    protected function renderVariants(string $bytes, array $variants, array $blurRegions = []): array
    {
        $source = @imagecreatefromstring($bytes);

        if (! $source instanceof GdImage) {
            throw new RuntimeException('Image illisible (format non pris en charge par GD).');
        }

        $rendered = [];

        foreach ($variants as $variant) {
            $rendered[$variant['suffix']] = $this->cropResizeEncode($source, $variant, $blurRegions);
        }

        return $rendered;
    }

    /**
     * @param  array{suffix: string, width: int, ratio: float, focus?: array{0: float, 1: float}, zoom?: float}  $variant
     * @param  list<array{0: float, 1: float, 2: float, 3: float}>  $blurRegions
     */
    private function cropResizeEncode(GdImage $source, array $variant, array $blurRegions): string
    {
        $sourceWidth = imagesx($source);
        $sourceHeight = imagesy($source);
        [$focusX, $focusY] = $variant['focus'] ?? [0.5, 0.5];
        $zoom = max(1.0, $variant['zoom'] ?? 1.0);
        $ratio = $variant['ratio'];

        if ($sourceWidth / $sourceHeight > $ratio) {
            $cropHeight = $sourceHeight / $zoom;
            $cropWidth = $cropHeight * $ratio;
        } else {
            $cropWidth = $sourceWidth / $zoom;
            $cropHeight = $cropWidth / $ratio;
        }

        $cropX = (int) round(min(max($focusX * $sourceWidth - $cropWidth / 2, 0), $sourceWidth - $cropWidth));
        $cropY = (int) round(min(max($focusY * $sourceHeight - $cropHeight / 2, 0), $sourceHeight - $cropHeight));

        $width = $variant['width'];
        $height = (int) round($width / $ratio);
        $target = imagecreatetruecolor($width, $height);
        imagecopyresampled($target, $source, 0, 0, $cropX, $cropY, $width, $height, (int) round($cropWidth), (int) round($cropHeight));

        foreach ($blurRegions as $region) {
            $this->pixelate($target, $region);
        }

        ob_start();
        imagewebp($target, null, self::WEBP_QUALITY);

        return (string) ob_get_clean();
    }

    /**
     * Hide a region (a readable license plate) by pixelating then blurring it.
     *
     * @param  array{0: float, 1: float, 2: float, 3: float}  $region
     */
    private function pixelate(GdImage $image, array $region): void
    {
        [$x, $y, $width, $height] = [
            (int) round($region[0] * imagesx($image)),
            (int) round($region[1] * imagesy($image)),
            max(1, (int) round($region[2] * imagesx($image))),
            max(1, (int) round($region[3] * imagesy($image))),
        ];

        $tiny = imagecreatetruecolor(max(1, intdiv($width, 14)), max(1, intdiv($height, 14)));
        imagecopyresampled($tiny, $image, 0, 0, $x, $y, imagesx($tiny), imagesy($tiny), $width, $height);
        imagecopyresampled($image, $tiny, $x, $y, 0, 0, $width, $height, imagesx($tiny), imagesy($tiny));

        $patch = imagecreatetruecolor($width, $height);
        imagecopy($patch, $image, 0, 0, $x, $y, $width, $height);
        for ($pass = 0; $pass < 6; $pass++) {
            imagefilter($patch, IMG_FILTER_GAUSSIAN_BLUR);
        }
        imagecopy($image, $patch, $x, $y, 0, 0, $width, $height);
    }

    /**
     * Read a JSON file into an array, with a clear error when it is missing or invalid.
     *
     * @return array<mixed>
     */
    protected function readJson(string $path): array
    {
        if (! File::exists($path)) {
            throw new RuntimeException("Fichier introuvable : {$path}");
        }

        return json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);
    }

    /**
     * Write pretty, diff-friendly JSON (UTF-8, unescaped slashes).
     *
     * @param  array<mixed>  $data
     */
    protected function writeJson(string $path, array $data): void
    {
        File::put($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");
    }

    /**
     * "4:5" or "16:10" to a width / height ratio.
     */
    protected function parseRatio(string $ratio): float
    {
        [$width, $height] = array_map('floatval', explode(':', $ratio));

        return $width / $height;
    }

    /**
     * Human readable size: 1.2 Mo.
     */
    protected function formatBytes(int $bytes): string
    {
        return number_format($bytes / 1024 / 1024, 1, ',', ' ').' Mo';
    }
}
