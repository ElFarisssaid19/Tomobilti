<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * PATCH /api/admin/cars/{car}/images/{image} { alt?, is_primary? }.
 */
class CarImageUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'alt' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_primary' => ['sometimes', 'accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['alt' => 'texte alternatif', 'is_primary' => 'photo principale'];
    }
}
