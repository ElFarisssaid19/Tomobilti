<?php

namespace Tests\Feature\Admin;

use App\Models\Brand;
use App\Models\Car;
use App\Models\CarImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminCarImageTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Car $car;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->admin = User::factory()->admin()->create();
        $this->car = Car::factory()->for(Brand::factory()->create(['name' => 'Dacia']))->create(['model' => 'Duster', 'year' => 2025, 'slug' => 'dacia-duster-2025']);
    }

    /**
     * A 1200 × 900 JPEG carrying an EXIF segment with a fake GPS marker.
     */
    private function photoWithMetadata(string $name = 'duster.jpg'): UploadedFile
    {
        $image = imagecreatetruecolor(1200, 900);
        imagefill($image, 0, 0, imagecolorallocate($image, 30, 120, 200));
        ob_start();
        imagejpeg($image, null, 90);
        $jpeg = (string) ob_get_clean();

        $tiff = "II*\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00\x00GPS-SECRET-33.5731N";
        $app1 = "\xFF\xE1".pack('n', strlen($tiff) + 8)."Exif\x00\x00".$tiff;
        $path = tempnam(sys_get_temp_dir(), 'tmb').'.jpg';
        file_put_contents($path, substr($jpeg, 0, 2).$app1.substr($jpeg, 2));

        return new UploadedFile($path, $name, 'image/jpeg', null, true);
    }

    public function test_uploads_are_cropped_to_16_10_in_two_webp_widths_without_metadata(): void
    {
        $placeholder = CarImage::factory()->for($this->car)->create(['path' => 'cars/placeholders/dacia-duster-2025.svg', 'is_primary' => true, 'sort_order' => 0]);
        Storage::disk('public')->put($placeholder->path, '<svg/>');

        $response = $this->actingAs($this->admin)
            ->post("/api/admin/cars/{$this->car->id}/images", ['images' => [$this->photoWithMetadata(), UploadedFile::fake()->image('arriere.png', 1600, 1200)]], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('message', '2 photos ajoutées.')
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.is_primary', true)
            ->assertJsonPath('data.0.author', 'Tomobilti')
            ->assertJsonPath('data.0.alt', 'Dacia Duster 2025')
            ->assertJsonPath('data.1.is_primary', false);

        $this->assertModelMissing($placeholder);
        Storage::disk('public')->assertMissing($placeholder->path);

        $image = $this->car->images()->first();
        $this->assertStringStartsWith('cars/dacia-duster-2025/upload-', $image->path);
        $large = Storage::disk('public')->get($image->path);
        $thumbnail = Storage::disk('public')->get($image->thumbnailPath());

        $this->assertSame('WEBP', substr($large, 8, 4));
        $this->assertSame([1600, 1000], array_slice(getimagesizefromstring($large), 0, 2));
        $this->assertSame([800, 500], array_slice(getimagesizefromstring($thumbnail), 0, 2));
        $this->assertStringNotContainsString('GPS-SECRET', $large);
        $this->assertStringNotContainsString('Exif', $large);
        $this->assertStringNotContainsString('GPS-SECRET', $thumbnail);
    }

    public function test_only_images_up_to_5_mb_are_accepted(): void
    {
        $this->actingAs($this->admin)
            ->post("/api/admin/cars/{$this->car->id}/images", ['images' => [
                UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
                UploadedFile::fake()->image('huge.jpg', 1600, 1000)->size(6000),
            ]], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['images.0', 'images.1']);

        $this->assertSame(0, $this->car->images()->count());
    }

    public function test_reorders_and_sets_the_primary_photo(): void
    {
        [$first, $second, $third] = collect([0, 1, 2])->map(fn (int $order) => CarImage::factory()->for($this->car)->create([
            'is_primary' => $order === 0,
            'sort_order' => $order,
        ]))->all();

        $this->actingAs($this->admin)
            ->putJson("/api/admin/cars/{$this->car->id}/images/order", ['ids' => [$third->id, $first->id, $second->id]])
            ->assertOk()
            ->assertJsonPath('data.*.id', [$third->id, $first->id, $second->id]);

        $this->actingAs($this->admin)
            ->putJson("/api/admin/cars/{$this->car->id}/images/order", ['ids' => [$third->id, $first->id]])
            ->assertUnprocessable()
            ->assertJsonPath('errors.ids.0', 'La liste doit contenir toutes les photos de la voiture, une seule fois.');

        $this->actingAs($this->admin)
            ->patchJson("/api/admin/cars/{$this->car->id}/images/{$second->id}", ['is_primary' => true, 'alt' => 'Dacia Duster 2025, intérieur'])
            ->assertOk()
            ->assertJsonPath('data.0.id', $second->id)
            ->assertJsonPath('data.0.is_primary', true)
            ->assertJsonPath('data.0.alt', 'Dacia Duster 2025, intérieur');

        $this->assertSame([$second->id], $this->car->images()->where('is_primary', true)->pluck('id')->all());
        $this->assertSame($second->id, $this->car->primaryImage()->first()->id);
    }

    public function test_deleting_the_primary_photo_promotes_the_next_one_and_removes_the_files(): void
    {
        $primary = CarImage::factory()->for($this->car)->primary()->create(['path' => 'cars/dacia-duster-2025/01-1600.webp']);
        $next = CarImage::factory()->for($this->car)->create(['sort_order' => 1]);
        Storage::disk('public')->put($primary->path, 'x');
        Storage::disk('public')->put($primary->thumbnailPath(), 'x');

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/cars/{$this->car->id}/images/{$primary->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Photo supprimée.')
            ->assertJsonPath('data.0.id', $next->id)
            ->assertJsonPath('data.0.is_primary', true);

        Storage::disk('public')->assertMissing([$primary->path, $primary->thumbnailPath()]);
    }

    public function test_a_photo_of_another_car_is_not_found(): void
    {
        $otherImage = CarImage::factory()->create();

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/cars/{$this->car->id}/images/{$otherImage->id}")
            ->assertNotFound();

        $this->assertModelExists($otherImage);
    }
}
