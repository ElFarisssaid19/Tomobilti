<?php

namespace App\Services;

use App\Console\Commands\Concerns\ProcessesPhotos;
use App\Console\Commands\ImportCarPhotos;
use App\Models\Car;
use App\Models\CarImage;
use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Photos uploaded in the back office, processed by the same GD pipeline as the demo
 * photos (ProcessesPhotos, used by tomobilti:import-car-photos):
 *
 *  - turned upright from the camera's EXIF orientation, then centre-cropped to 16:10;
 *  - saved as two WebP files, `{name}-1600.webp` (in `path`) and `{name}-800.webp`;
 *  - GD re-encodes every pixel and never writes metadata, so EXIF and GPS data are gone.
 *
 * Uploaded photos are credited "Tomobilti" (the agency took them). The first photo
 * of a car becomes its primary photo, and replaces the generated SVG placeholder.
 */
class CarPhotoUploader
{
    use ProcessesPhotos;

    /**
     * @param  list<UploadedFile>  $files
     * @return Collection<int, CarImage> the new images
     *
     * @throws ValidationException when a file cannot be read as an image
     */
    public function upload(Car $car, array $files): Collection
    {
        $ratio = $this->parseRatio(ImportCarPhotos::RATIO);
        $variants = [
            ['suffix' => (string) CarImage::LARGE_WIDTH, 'width' => CarImage::LARGE_WIDTH, 'ratio' => $ratio],
            ['suffix' => (string) CarImage::THUMBNAIL_WIDTH, 'width' => CarImage::THUMBNAIL_WIDTH, 'ratio' => $ratio],
        ];

        // Every file is processed before anything is saved: one unreadable file
        // refuses the whole upload instead of leaving half of it behind.
        $rendered = [];

        foreach ($files as $index => $file) {
            try {
                $rendered[] = $this->renderVariants($this->uprightBytes($file), $variants);
            } catch (RuntimeException) {
                throw ValidationException::withMessages(["images.{$index}" => __('api.admin.cars.image_unreadable')]);
            }
        }

        $disk = Storage::disk('public');
        $car->loadMissing('brand');

        return DB::transaction(function () use ($car, $rendered, $disk): Collection {
            $this->removePlaceholders($car);

            $nextOrder = (int) $car->images()->max('sort_order') + 1;
            $hasPrimary = $car->images()->where('is_primary', true)->exists();
            $created = collect();

            foreach ($rendered as $offset => $files) {
                $base = "cars/{$car->slug}/upload-".Str::lower(Str::random(16));
                $disk->put("{$base}-".CarImage::LARGE_WIDTH.'.webp', $files[(string) CarImage::LARGE_WIDTH]);
                $disk->put("{$base}-".CarImage::THUMBNAIL_WIDTH.'.webp', $files[(string) CarImage::THUMBNAIL_WIDTH]);

                $created->push($car->images()->create([
                    'path' => "{$base}-".CarImage::LARGE_WIDTH.'.webp',
                    'alt' => "{$car->brand->name} {$car->model} {$car->year}",
                    'is_primary' => ! $hasPrimary && $offset === 0,
                    'sort_order' => $nextOrder + $offset,
                    'author' => __('api.admin.cars.photo_credit'),
                    'license' => null,
                    'source_url' => null,
                ]));
            }

            return $created;
        });
    }

    /**
     * Delete a photo and its files. When it was the primary photo, the next one in
     * display order takes its place.
     */
    public function delete(CarImage $image): void
    {
        DB::transaction(function () use ($image): void {
            $image->delete();

            if ($image->is_primary) {
                CarImage::query()
                    ->where('car_id', $image->car_id)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->first()
                    ?->update(['is_primary' => true]);
            }
        });

        Storage::disk('public')->delete(array_unique([$image->path, $image->thumbnailPath()]));
    }

    /**
     * Make one photo the primary one and move it to the front.
     */
    public function makePrimary(CarImage $image): void
    {
        DB::transaction(function () use ($image): void {
            CarImage::query()->where('car_id', $image->car_id)->whereKeyNot($image->id)->update(['is_primary' => false]);
            CarImage::query()->where('car_id', $image->car_id)->increment('sort_order');
            $image->forceFill(['is_primary' => true, 'sort_order' => 0])->save();
        });
    }

    /**
     * Save a new display order. $ids lists every photo of the car exactly once.
     *
     * @param  list<int>  $ids
     */
    public function reorder(Car $car, array $ids): void
    {
        DB::transaction(function () use ($car, $ids): void {
            foreach ($ids as $position => $id) {
                $car->images()->whereKey($id)->update(['sort_order' => $position]);
            }
        });
    }

    /**
     * The generated SVG placeholder goes away with the first real photo.
     */
    private function removePlaceholders(Car $car): void
    {
        $car->images()->get()
            ->filter(fn (CarImage $image): bool => $image->isPlaceholder())
            ->each(function (CarImage $image): void {
                $image->delete();
                Storage::disk('public')->delete($image->path);
            });
    }

    /**
     * Phone photos are often stored sideways with an EXIF "Orientation" flag that GD
     * ignores: turn them upright first (re-encoded losslessly as PNG for the pipeline).
     */
    private function uprightBytes(UploadedFile $file): string
    {
        $bytes = (string) $file->get();
        $rotation = $this->exifRotation($file);

        if ($rotation === 0) {
            return $bytes;
        }

        $image = @imagecreatefromstring($bytes);

        if (! $image instanceof GdImage) {
            return $bytes;
        }

        $rotated = imagerotate($image, $rotation, 0);
        ob_start();
        imagepng($rotated);

        return (string) ob_get_clean();
    }

    /**
     * Degrees to rotate (counter-clockwise, as imagerotate expects) for the EXIF orientation.
     */
    private function exifRotation(UploadedFile $file): int
    {
        if (! function_exists('exif_read_data') || ! in_array($file->getMimeType(), ['image/jpeg', 'image/webp'], true)) {
            return 0;
        }

        $exif = @exif_read_data($file->getRealPath());

        return match ((int) ($exif['Orientation'] ?? 1)) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };
    }
}
