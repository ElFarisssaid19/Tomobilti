<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

/**
 * Slug built from a name ("Agadir Al Massira" → "agadir-al-massira"), with "-2",
 * "-3"… when it is taken. Used when the back office creates a category, a brand, an
 * agency or an option; the slug then stays the same, so public links keep working.
 */
trait HasUniqueSlug
{
    public static function uniqueSlugFor(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'element';
        $taken = static::query()
            ->where(fn (Builder $query) => $query->where('slug', $base)->orWhere('slug', 'like', "{$base}-%"))
            ->when($ignoreId, fn (Builder $query, int $id) => $query->whereKeyNot($id))
            ->pluck('slug')
            ->all();

        $slug = $base;

        for ($suffix = 2; in_array($slug, $taken, true); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }
}
