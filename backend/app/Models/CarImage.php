<?php

namespace App\Models;

use Database\Factories\CarImageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Photo of a car, stored on the "public" disk.
 *
 * Photos come in two WebP widths sharing one base name: `{name}-1600.webp` (stored in
 * `path`, detail page) and `{name}-800.webp` (cards and lists). SVG placeholders have a
 * single file. `source_url`, `author` and `license` credit the photo's origin.
 */
#[Fillable(['car_id', 'path', 'alt', 'is_primary', 'sort_order', 'source_url', 'author', 'license'])]
class CarImage extends Model
{
    /** @use HasFactory<CarImageFactory> */
    use HasFactory;

    /**
     * Width of the full-size photo, the one stored in `path`.
     */
    public const LARGE_WIDTH = 1600;

    /**
     * Width of the card-size photo.
     */
    public const THUMBNAIL_WIDTH = 800;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * The car shown in this image.
     *
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class)->withTrashed();
    }

    /**
     * Public URL of the image (e.g. http://localhost:8000/storage/cars/...).
     *
     * @return Attribute<string, never>
     */
    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn (): string => Storage::disk('public')->url($this->path),
        );
    }

    /**
     * Path of the card-size version: `cars/x/01-avant-1600.webp` becomes
     * `cars/x/01-avant-800.webp`. Images without a size suffix (SVG placeholders)
     * have no smaller version, so the path itself is returned.
     */
    public function thumbnailPath(): string
    {
        $largeSuffix = '-'.self::LARGE_WIDTH.'.webp';

        return Str::endsWith($this->path, $largeSuffix)
            ? Str::replaceLast($largeSuffix, '-'.self::THUMBNAIL_WIDTH.'.webp', $this->path)
            : $this->path;
    }

    /**
     * Public URL of the card-size version (falls back to `url` for placeholders).
     *
     * @return Attribute<string, never>
     */
    protected function thumbnailUrl(): Attribute
    {
        return Attribute::make(
            get: fn (): string => Storage::disk('public')->url($this->thumbnailPath()),
        );
    }
}
