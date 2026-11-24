<?php

namespace App\Http\Requests\Admin;

use App\Enums\LocationType;
use App\Models\Location;
use App\Rules\MoroccanPhone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create or edit an agency. The phone is stored in E.164 (+212…).
 */
class LocationRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['phone' => MoroccanPhone::normalize($this->input('phone'))]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Location|null $location */
        $location = $this->route('location');

        return [
            'name' => ['required', 'string', 'max:150', Rule::unique('locations', 'name')->ignore($location?->id)],
            'type' => ['required', Rule::enum(LocationType::class)],
            'city' => ['required', 'string', 'max:100'],
            'address' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', new MoroccanPhone],
            'opening_hours' => ['nullable', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['opening_hours' => 'horaires', 'is_active' => 'active'];
    }
}
