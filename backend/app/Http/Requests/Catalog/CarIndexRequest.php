<?php

namespace App\Http\Requests\Catalog;

use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Filters\CarFilter;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Query string of GET /api/cars. Every parameter is optional; an unknown slug, a
 * wrong enum value or an impossible period gets a French 422 error.
 *
 * Lists may be sent as "category=suv,luxe" (what the SPA does) or "category[]=suv".
 * Dates are whole days (YYYY-MM-DD): see CarFilter::byPeriod().
 */
class CarIndexRequest extends FormRequest
{
    /**
     * Parameters that accept several values.
     *
     * @var list<string>
     */
    private const LIST_PARAMETERS = ['category', 'brand', 'fuel', 'slug'];

    /**
     * Split comma-separated lists, and accept "true" / "false" for the switch.
     */
    protected function prepareForValidation(): void
    {
        foreach (self::LIST_PARAMETERS as $parameter) {
            if (is_string($this->input($parameter))) {
                $values = array_values(array_filter(array_map('trim', explode(',', $this->input($parameter)))));
                $this->merge([$parameter => $values]);
            }
        }

        if (in_array($this->input('air_conditioning'), ['true', 'false'], true)) {
            $this->merge(['air_conditioning' => $this->input('air_conditioning') === 'true']);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category' => ['nullable', 'array', 'max:10'],
            'category.*' => ['string', Rule::exists('categories', 'slug')],
            'brand' => ['nullable', 'array', 'max:20'],
            'brand.*' => ['string', Rule::exists('brands', 'slug')],
            'transmission' => ['nullable', Rule::enum(Transmission::class)],
            'fuel' => ['nullable', 'array', 'max:4'],
            'fuel.*' => [Rule::enum(FuelType::class)],
            'seats_min' => ['nullable', 'integer', 'between:1,9'],
            'price_min' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'price_max' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'location' => ['nullable', 'string', Rule::exists('locations', 'slug')->where('is_active', true)],
            'air_conditioning' => ['nullable', 'boolean'],
            'q' => ['nullable', 'string', 'max:100'],
            'start_at' => ['nullable', 'required_with:end_at', 'date_format:Y-m-d', 'after_or_equal:today'],
            'end_at' => ['nullable', 'required_with:start_at', 'date_format:Y-m-d', 'after:start_at'],
            'slug' => ['nullable', 'array', 'max:50'],
            'slug.*' => ['string', 'max:150'],
            'sort' => ['nullable', Rule::in(CarFilter::SORTS)],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * The price range must not be upside down.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $min = $this->input('price_min');
                $max = $this->input('price_max');

                if (is_numeric($min) && is_numeric($max) && (float) $max < (float) $min) {
                    $validator->errors()->add('price_max', __('api.catalog.price_range'));
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'start_at.after_or_equal' => __('api.catalog.start_in_past'),
            'end_at.after' => __('api.catalog.end_before_start'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'category' => 'catégorie',
            'category.*' => 'catégorie',
            'brand' => 'marque',
            'brand.*' => 'marque',
            'transmission' => 'boîte de vitesses',
            'fuel' => 'carburant',
            'fuel.*' => 'carburant',
            'seats_min' => 'nombre de places',
            'price_min' => 'prix minimum',
            'price_max' => 'prix maximum',
            'location' => 'agence',
            'air_conditioning' => 'climatisation',
            'q' => 'recherche',
            'start_at' => 'date de départ',
            'end_at' => 'date de retour',
            'slug' => 'voitures',
            'slug.*' => 'voiture',
            'sort' => 'tri',
            'page' => 'page',
        ];
    }
}
