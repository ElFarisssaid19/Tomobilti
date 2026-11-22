<?php

namespace Tests\Feature\Console;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class GenerateImageCreditsTest extends TestCase
{
    private string $path;

    protected function tearDown(): void
    {
        if (isset($this->path)) {
            File::deleteDirectory($this->path);
        }

        parent::tearDown();
    }

    public function test_builds_the_markdown_and_json_credits_from_the_manifests(): void
    {
        $this->path = sys_get_temp_dir().'/tomobilti-credits-'.Str::random(8);
        File::ensureDirectoryExists("{$this->path}/cars/dacia-logan-2024");
        File::ensureDirectoryExists("{$this->path}/site");
        File::put("{$this->path}/cars/sources.json", '{"ignored": true}');
        File::put("{$this->path}/cars/dacia-logan-2024/01-avant-trois-quarts.json", json_encode([
            'file' => '01-avant-trois-quarts',
            'car' => 'dacia-logan-2024',
            'model' => 'Dacia Logan 2024',
            'view' => 'avant-trois-quarts',
            'source' => 'Wikimedia Commons',
            'title' => 'File:Logan.jpg',
            'source_url' => 'https://commons.wikimedia.org/wiki/File:Logan.jpg',
            'author' => 'Jane | Doe',
            'author_url' => null,
            'license' => 'CC BY-SA 4.0',
            'license_url' => 'https://creativecommons.org/licenses/by-sa/4.0',
            'changes' => 'Recadrée au format 16:10 et redimensionnée, convertie en WebP, plaque floutée',
            'derivative_license' => 'CC BY-SA 4.0',
            'note' => null,
        ]));
        File::put("{$this->path}/site/hero.json", json_encode([
            'file' => 'hero',
            'description' => 'Route du Haut Atlas',
            'source' => 'Pexels',
            'source_url' => 'https://www.pexels.com/photo/570018/',
            'author' => 'Loubna Belmekki',
            'author_url' => 'https://www.pexels.com/@loubna/',
            'license' => 'Pexels License',
            'license_url' => 'https://www.pexels.com/license/',
            'changes' => 'Recadrée et redimensionnée, convertie en WebP',
            'derivative_license' => null,
        ]));

        $this->artisan('tomobilti:image-credits', [
            '--cars-path' => "{$this->path}/cars",
            '--site-path' => "{$this->path}/site",
            '--markdown' => "{$this->path}/out/image-credits.md",
            '--json' => "{$this->path}/out/image-credits.json",
        ])->assertSuccessful();

        $markdown = File::get("{$this->path}/out/image-credits.md");
        $this->assertStringContainsString('| Dacia Logan 2024 | `dacia-logan-2024/01-avant-trois-quarts` | Jane \| Doe | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | Recadrée au format 16:10 et redimensionnée, convertie en WebP, plaque floutée. Version modifiée partagée sous la même licence (CC BY-SA 4.0) |', $markdown);
        $this->assertStringContainsString('| [Pexels License](https://www.pexels.com/license/) | Recadrée et redimensionnée, convertie en WebP | [Pexels]', $markdown);
        $this->assertStringContainsString('[Loubna Belmekki](https://www.pexels.com/@loubna/)', $markdown);

        $json = json_decode(File::get("{$this->path}/out/image-credits.json"), true);
        $this->assertCount(1, $json['cars']);
        $this->assertSame('Dacia Logan 2024', $json['cars'][0]['model']);
        $this->assertStringEndsWith('plaque floutée', $json['cars'][0]['changes']);
        $this->assertSame('CC BY-SA 4.0', $json['cars'][0]['derivative_license']);
        $this->assertNull($json['site'][0]['derivative_license']);
        $this->assertSame('Route du Haut Atlas', $json['site'][0]['description']);
    }
}
