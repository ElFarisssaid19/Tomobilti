<?php

namespace App\Http\Requests\Admin;

use App\Enums\ExtraPricing;
use App\Models\Extra;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create or edit an option. A new price only applies to new bookings (reservations
 * keep their price snapshot).
 */
class ExtraRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Extra|null $extra */
        $extra = $this->route('extra');

        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('extras', 'name')->ignore($extra?->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:50', 'regex:'.CategoryRequest::ICON_PATTERN],
            'price' => ['required', 'decimal:0,2', 'min:0', 'max:100000'],
            'pricing' => ['required', Rule::enum(ExtraPricing::class)],
            'max_quantity' => ['required', 'integer', 'min:1', 'max:10'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['icon.regex' => __('api.admin.settings.icon')];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['icon' => 'icône', 'pricing' => 'tarification', 'max_quantity' => 'quantité maximum', 'is_active' => 'active'];
    }
}
