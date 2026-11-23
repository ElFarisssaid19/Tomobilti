<?php

namespace Tests\Feature\Catalog;

use App\Enums\FuelType;
use App\Enums\ReservationStatus;
use App\Enums\Transmission;
use App\Models\Brand;
use App\Models\Car;
use App\Models\CarImage;
use App\Models\Category;
use App\Models\Location;
use App\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class CarIndexTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Slugs of the cars of a catalogue response, in order.
     *
     * @return list<string>
     */
    private function slugs(TestResponse $response): array
    {
        return array_column($response->json('data'), 'slug');
    }

    private function car(string $slug, array $attributes = []): Car
    {
        return Car::factory()->create(['slug' => $slug, ...$attributes]);
    }

    public function test_lists_only_available_cars_with_the_card_fields(): void
    {
        $car = $this->car('dacia-logan', ['price_per_day' => 250]);
        CarImage::factory()->primary()->for($car)->create(['path' => 'cars/dacia-logan/01-avant-1600.webp']);
        $this->car('en-maintenance')->update(['status' => 'maintenance']);
        Car::factory()->outOfService()->create(['slug' => 'hors-service']);
        $this->car('supprimee')->delete();

        $response = $this->getJson('/api/cars')->assertOk();

        $this->assertSame(['dacia-logan'], $this->slugs($response));
        $response
            ->assertJsonPath('data.0.price_per_day', '250.00')
            ->assertJsonPath('data.0.brand.name', $car->brand->name)
            ->assertJsonPath('data.0.category.slug', $car->category->slug)
            ->assertJsonPath('data.0.location.slug', $car->location->slug)
            ->assertJsonPath('data.0.primary_image.thumbnail_url', 'http://localhost:8000/storage/cars/dacia-logan/01-avant-800.webp')
            ->assertJsonMissingPath('data.0.plate_number')
            ->assertJsonMissingPath('data.0.mileage')
            ->assertJsonMissingPath('data.0.status');
    }

    public function test_filters_by_one_or_more_category_slugs(): void
    {
        $suv = Category::factory()->create(['slug' => 'suv']);
        $luxe = Category::factory()->create(['slug' => 'luxe']);
        $this->car('duster', ['category_id' => $suv->id]);
        $this->car('classe-c', ['category_id' => $luxe->id]);
        $this->car('clio');

        $this->assertEqualsCanonicalizing(['duster'], $this->slugs($this->getJson('/api/cars?category=suv')));
        $this->assertEqualsCanonicalizing(['duster', 'classe-c'], $this->slugs($this->getJson('/api/cars?category=suv,luxe')));
        $this->assertEqualsCanonicalizing(['duster', 'classe-c'], $this->slugs($this->getJson('/api/cars?category[]=suv&category[]=luxe')));
    }

    public function test_filters_by_one_or_more_brand_slugs(): void
    {
        $dacia = Brand::factory()->create(['slug' => 'dacia']);
        $renault = Brand::factory()->create(['slug' => 'renault']);
        $this->car('logan', ['brand_id' => $dacia->id]);
        $this->car('clio', ['brand_id' => $renault->id]);
        $this->car('tucson');

        $this->assertSame(['logan'], $this->slugs($this->getJson('/api/cars?brand=dacia')));
        $this->assertEqualsCanonicalizing(['logan', 'clio'], $this->slugs($this->getJson('/api/cars?brand=dacia,renault')));
    }

    public function test_filters_by_transmission(): void
    {
        $this->car('auto', ['transmission' => Transmission::Automatic]);
        $this->car('manuelle', ['transmission' => Transmission::Manual]);

        $this->assertSame(['auto'], $this->slugs($this->getJson('/api/cars?transmission=automatic')));
    }

    public function test_filters_by_one_or_more_fuels(): void
    {
        $this->car('diesel', ['fuel' => FuelType::Diesel]);
        $this->car('hybride', ['fuel' => FuelType::Hybrid]);
        $this->car('essence', ['fuel' => FuelType::Petrol]);

        $this->assertSame(['hybride'], $this->slugs($this->getJson('/api/cars?fuel=hybrid')));
        $this->assertEqualsCanonicalizing(['diesel', 'hybride'], $this->slugs($this->getJson('/api/cars?fuel=diesel,hybrid')));
    }

    public function test_filters_by_minimum_seats(): void
    {
        $this->car('cinq', ['seats' => 5]);
        $this->car('sept', ['seats' => 7]);
        $this->car('neuf', ['seats' => 9]);

        $this->assertEqualsCanonicalizing(['sept', 'neuf'], $this->slugs($this->getJson('/api/cars?seats_min=7')));
    }

    public function test_filters_by_price_range_with_inclusive_bounds(): void
    {
        $this->car('a-250', ['price_per_day' => 250]);
        $this->car('a-400', ['price_per_day' => 400]);
        $this->car('a-800', ['price_per_day' => 800]);
        $this->car('a-1200', ['price_per_day' => 1200]);

        $this->assertSame(['a-400', 'a-800'], $this->slugs($this->getJson('/api/cars?price_min=400&price_max=800')));
        $this->assertSame(['a-800', 'a-1200'], $this->slugs($this->getJson('/api/cars?price_min=800')));
        $this->assertSame(['a-250'], $this->slugs($this->getJson('/api/cars?price_max=399.99')));
    }

    public function test_filters_by_home_location(): void
    {
        $gueliz = Location::factory()->create(['slug' => 'marrakech-gueliz']);
        $this->car('a-gueliz', ['location_id' => $gueliz->id]);
        $this->car('ailleurs');

        $this->assertSame(['a-gueliz'], $this->slugs($this->getJson('/api/cars?location=marrakech-gueliz')));
    }

    public function test_filters_by_air_conditioning(): void
    {
        $this->car('climatisee', ['air_conditioning' => true]);
        $this->car('sans-clim', ['air_conditioning' => false]);

        $this->assertSame(['climatisee'], $this->slugs($this->getJson('/api/cars?air_conditioning=1')));
        $this->assertSame(['climatisee'], $this->slugs($this->getJson('/api/cars?air_conditioning=true')));
        $this->assertSame(['sans-clim'], $this->slugs($this->getJson('/api/cars?air_conditioning=0')));
    }

    public function test_search_matches_every_word_in_the_brand_or_the_model(): void
    {
        $dacia = Brand::factory()->create(['name' => 'Dacia', 'slug' => 'dacia']);
        $this->car('dacia-duster', ['brand_id' => $dacia->id, 'model' => 'Duster']);
        $this->car('dacia-logan', ['brand_id' => $dacia->id, 'model' => 'Logan']);
        $this->car('hyundai-tucson', ['model' => 'Tucson']);

        $this->assertEqualsCanonicalizing(['dacia-duster', 'dacia-logan'], $this->slugs($this->getJson('/api/cars?q=dacia')));
        $this->assertSame(['dacia-duster'], $this->slugs($this->getJson('/api/cars?q=DACIA+dus')));
        $this->assertSame(['hyundai-tucson'], $this->slugs($this->getJson('/api/cars?q=tucs')));
        $this->assertSame([], $this->slugs($this->getJson('/api/cars?q=%25')), 'a "%" is searched literally');
    }

    public function test_filters_by_slugs_for_the_favorites(): void
    {
        $this->car('logan', ['price_per_day' => 250]);
        $this->car('clio', ['price_per_day' => 330]);
        $this->car('tucson');

        $this->assertSame(['logan', 'clio'], $this->slugs($this->getJson('/api/cars?slug=logan,clio,retiree')));
    }

    public function test_combines_filters(): void
    {
        $suv = Category::factory()->create(['slug' => 'suv']);
        $this->car('suv-auto-600', ['category_id' => $suv->id, 'transmission' => Transmission::Automatic, 'price_per_day' => 600]);
        $this->car('suv-auto-1500', ['category_id' => $suv->id, 'transmission' => Transmission::Automatic, 'price_per_day' => 1500]);
        $this->car('suv-manuel-500', ['category_id' => $suv->id, 'transmission' => Transmission::Manual, 'price_per_day' => 500]);
        $this->car('citadine-auto-300', ['transmission' => Transmission::Automatic, 'price_per_day' => 300]);

        $response = $this->getJson('/api/cars?category=suv&transmission=automatic&price_min=400&price_max=1000');

        $this->assertSame(['suv-auto-600'], $this->slugs($response));
    }

    public function test_period_keeps_only_cars_without_a_blocking_reservation(): void
    {
        $this->travelTo('2026-12-01 09:00');
        $book = fn (string $slug, ReservationStatus $status, string $start, string $end) => Reservation::factory()
            ->for($this->car($slug))
            ->between($start, $end)
            ->create(['status' => $status]);

        $book('confirmee', ReservationStatus::Confirmed, '2026-12-18 10:00', '2026-12-22 10:00');
        $book('en-attente', ReservationStatus::Pending, '2026-12-21 10:00', '2026-12-28 10:00');
        $book('en-cours', ReservationStatus::Active, '2026-12-15 10:00', '2026-12-30 10:00');
        $book('annulee', ReservationStatus::Cancelled, '2026-12-19 10:00', '2026-12-23 10:00');
        $book('refusee', ReservationStatus::Rejected, '2026-12-19 10:00', '2026-12-23 10:00');
        $book('plus-tard', ReservationStatus::Confirmed, '2027-01-10 10:00', '2027-01-12 10:00');
        $this->car('libre');

        $response = $this->getJson('/api/cars?start_at=2026-12-20&end_at=2026-12-24')->assertOk();

        $this->assertEqualsCanonicalizing(['annulee', 'refusee', 'plus-tard', 'libre'], $this->slugs($response));
    }

    public function test_period_counts_whole_days_so_a_reservation_on_the_first_or_last_day_excludes_the_car(): void
    {
        $this->travelTo('2026-12-01 09:00');
        Reservation::factory()->for($this->car('rendue-le-premier-jour'))->between('2026-12-15 10:00', '2026-12-20 10:00')->confirmed()->create();
        Reservation::factory()->for($this->car('prise-le-dernier-jour'))->between('2026-12-24 18:00', '2026-12-26 10:00')->confirmed()->create();
        Reservation::factory()->for($this->car('rendue-la-veille'))->between('2026-12-15 10:00', '2026-12-19 10:00')->confirmed()->create();

        $response = $this->getJson('/api/cars?start_at=2026-12-20&end_at=2026-12-24');

        $this->assertSame(['rendue-la-veille'], $this->slugs($response));
    }

    /**
     * @return array<string, array{string, list<string>}>
     */
    public static function sorts(): array
    {
        return [
            'default: cheapest first' => ['', ['a', 'b', 'c']],
            'price_asc' => ['price_asc', ['a', 'b', 'c']],
            'price_desc' => ['price_desc', ['c', 'b', 'a']],
            'newest model year' => ['newest', ['b', 'c', 'a']],
            'most completed reservations' => ['popular', ['c', 'a', 'b']],
        ];
    }

    /**
     * @param  list<string>  $expected
     */
    #[DataProvider('sorts')]
    public function test_sorts_the_cars(string $sort, array $expected): void
    {
        $this->travelTo('2026-12-01 09:00');
        $a = $this->car('a', ['price_per_day' => 250, 'year' => 2022]);
        $this->car('b', ['price_per_day' => 400, 'year' => 2025]);
        $c = $this->car('c', ['price_per_day' => 900, 'year' => 2024]);
        Reservation::factory()->for($c)->count(2)->between('2026-10-01 10:00', '2026-10-03 10:00')->completed()->create();
        Reservation::factory()->for($a)->between('2026-10-05 10:00', '2026-10-06 10:00')->completed()->create();
        Reservation::factory()->for($a)->count(3)->between('2026-10-08 10:00', '2026-10-09 10:00')->cancelled()->create();

        $response = $this->getJson('/api/cars'.($sort !== '' ? "?sort={$sort}" : ''))->assertOk();

        $this->assertSame($expected, $this->slugs($response));
    }

    public function test_paginates_twelve_cars_per_page_and_keeps_the_filters_in_the_links(): void
    {
        foreach (range(1, 14) as $index) {
            $this->car(sprintf('car-%02d', $index), ['price_per_day' => 200 + $index, 'transmission' => Transmission::Automatic]);
        }

        $page2 = $this->getJson('/api/cars?transmission=automatic&page=2')->assertOk();

        $this->assertSame(['car-13', 'car-14'], $this->slugs($page2));
        $page2
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.per_page', 12)
            ->assertJsonPath('meta.total', 14);
        $this->assertStringContainsString('transmission=automatic', $page2->json('links.prev'));
    }

    /**
     * @return array<string, array{string, string, string}>
     */
    public static function invalidQueries(): array
    {
        return [
            'unknown category' => ['category=suv,inconnue', 'category.1', 'Le champ catégorie sélectionné est invalide.'],
            'unknown brand' => ['brand=inconnue', 'brand.0', 'Le champ marque sélectionné est invalide.'],
            'unknown transmission' => ['transmission=cvt', 'transmission', 'Le champ boîte de vitesses sélectionné est invalide.'],
            'unknown fuel' => ['fuel=kerosene', 'fuel.0', 'Le champ carburant sélectionné est invalide.'],
            'seats not a number' => ['seats_min=beaucoup', 'seats_min', 'Le champ nombre de places doit être un entier.'],
            'negative price' => ['price_min=-5', 'price_min', 'La valeur de prix minimum doit être supérieure ou égale à 0.'],
            'upside-down price range' => ['price_min=800&price_max=300', 'price_max', 'Le prix maximum doit être supérieur ou égal au prix minimum.'],
            'unknown location' => ['location=tanger', 'location', 'Le champ agence sélectionné est invalide.'],
            'start in the past' => ['start_at=2026-11-30&end_at=2026-12-05', 'start_at', 'La date de départ ne peut pas être dans le passé.'],
            'end before start' => ['start_at=2026-12-10&end_at=2026-12-05', 'end_at', 'La date de retour doit être après la date de départ.'],
            'end without start' => ['end_at=2026-12-05', 'start_at', 'Le champ date de départ est obligatoire quand date de retour est présent.'],
            'date with a wrong format' => ['start_at=05/12/2026&end_at=2026-12-08', 'start_at', 'Le champ date de départ ne correspond pas au format Y-m-d.'],
            'unknown sort' => ['sort=random', 'sort', 'Le champ tri est invalide.'],
        ];
    }

    #[DataProvider('invalidQueries')]
    public function test_rejects_an_invalid_query_with_a_french_message(string $query, string $field, string $message): void
    {
        $this->travelTo('2026-12-01 09:00');
        Category::factory()->create(['slug' => 'suv']);

        $this->getJson("/api/cars?{$query}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$field => $message]);
    }

    public function test_the_number_of_queries_does_not_grow_with_the_number_of_cars(): void
    {
        $queriesFor = function (): int {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $this->getJson('/api/cars?sort=popular')->assertOk();
            DB::disableQueryLog();

            return count(DB::getQueryLog());
        };

        CarImage::factory()->primary()->for($this->car('premiere'))->create();
        $withOneCar = $queriesFor();

        foreach (range(1, 8) as $index) {
            CarImage::factory()->primary()->for($this->car("car-{$index}"))->create();
        }

        $this->assertSame($withOneCar, $queriesFor());
    }
}
