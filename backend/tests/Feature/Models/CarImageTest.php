<?php

namespace Tests\Feature\Models;

use App\Models\CarImage;
use PHPUnit\Framework\Attributes\TestWith;
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

    #[TestWith(['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'])]
    #[TestWith(['CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/'])]
    #[TestWith(['CC BY-SA 3.0 de', 'https://creativecommons.org/licenses/by-sa/3.0/de/'])]
    #[TestWith(['CC0', 'https://creativecommons.org/publicdomain/zero/1.0/'])]
    #[TestWith(['Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/'])]
    #[TestWith(['Pexels License', 'https://www.pexels.com/license/'])]
    #[TestWith(['Licence inconnue', null])]
    public function test_license_url_links_to_the_license_of_the_photo(string $license, ?string $url): void
    {
        $this->assertSame($url, (new CarImage(['license' => $license]))->license_url);
    }
}
