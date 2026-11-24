<?php

namespace App\Http\Requests\Admin;

use App\Enums\CarStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Car;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create (POST /api/admin/cars) or edit (PUT /api/admin/cars/{car}) a car. The slug
 * is never sent: the controller builds it from brand + model + year.
 *
 * The plate is normalized before validation ("12345 a 6" → "12345-A-6") and must
 * follow the Moroccan format: up to 5 digits, a letter, the prefecture code (1 to 89).
 */
class CarRequest extends FormRequest
{
    /**
     * Moroccan plate: number, letter (Latin transcription of the Arabic letter), prefecture code.
     */
    public const PLATE_PATTERN = '/^\d{1,5}-[A-Z]-([1-9]|[1-8]\d)$/';

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('plate_number'))) {
            $plate = strtoupper(trim($this->input('plate_number')));
            $plate = preg_replace('/\s*[\s\-|\/]\s*/', '-', $plate);

            $this->merge(['plate_number' => $plate]);
        }

        foreach (['model', 'color'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => trim($this->input($field))]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Car|null $car */
        $car = $this->route('car');

        return [
            'brand_id' => ['required', 'integer', Rule::exists('brands', 'id')],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')],
            'location_id' => ['required', 'integer', Rule::exists('locations', 'id')],
            'model' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:2000', 'max:'.(now()->year + 1)],
            'plate_number' => [
                'required',
                'string',
                'regex:'.self::PLATE_PATTERN,
                Rule::unique('cars', 'plate_number')->ignore($car?->id),
            ],
            'color' => ['required', 'string', 'max:50'],
            'transmission' => ['required', Rule::enum(Transmission::class)],
            'fuel' => ['required', Rule::enum(FuelType::class)],
            'seats' => ['required', 'integer', 'min:1', 'max:9'],
            'doors' => ['required', 'integer', 'min:2', 'max:5'],
            'luggage' => ['required', 'integer', 'min:0', 'max:20'],
            'air_conditioning' => ['required', 'boolean'],
            'mileage' => ['required', 'integer', 'min:0', 'max:2000000'],
            'price_per_day' => ['required', 'decimal:0,2', 'min:50', 'max:100000'],
            'deposit_amount' => ['required', 'decimal:0,2', 'min:0', 'max:1000000'],
            // Set on create only; later changes go through PATCH /status, which shows
            // the reservations a new status affects.
            'status' => $car ? ['exclude'] : ['required', Rule::enum(CarStatus::class)],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_featured' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plate_number.regex' => __('api.admin.cars.plate'),
            'plate_number.unique' => __('api.admin.cars.plate_taken'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'brand_id' => 'marque',
            'category_id' => 'catégorie',
            'location_id' => 'agence',
            'model' => 'modèle',
            'plate_number' => 'immatriculation',
            'color' => 'couleur',
            'transmission' => 'boîte de vitesses',
            'fuel' => 'carburant',
            'seats' => 'places',
            'doors' => 'portes',
            'luggage' => 'bagages',
            'air_conditioning' => 'climatisation',
            'mileage' => 'kilométrage',
            'price_per_day' => 'prix par jour',
            'deposit_amount' => 'caution',
            'is_featured' => 'voiture à la une',
        ];
    }
}
