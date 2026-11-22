<?php

namespace Tests\Feature\Models;

use App\Models\CarImage;
use Tests\TestCase;

class CarImageTest extends TestCase
{
    public function test_thumbnail_url_points_to_the_800px_version_of_a_photo(): void
    {
        $image = new CarImage(['path' => 'cars/dacia-logan-2024/01-avant-trois-quarts-1600.webp']);

        $this->assertStringEndsWith('/storage/cars/dacia-logan-2024/01-avant-trois-quarts-1600.webp', $image->url);
        $this->assertStringEndsWith('/storage/cars/dacia-logan-2024/01-avant-trois-quarts-800.webp', $image->thumbnail_url);
    }

    public function test_thumbnail_url_of_a_placeholder_is_the_placeholder_itself(): void
    {
        $image = new CarImage(['path' => 'cars/placeholders/dacia-logan-2024.svg']);

        $this->assertSame($image->url, $image->thumbnail_url);
    }
}
