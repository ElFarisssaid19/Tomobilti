<?php

namespace App\Http\Requests\Admin;

use App\Models\Brand;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create or edit a brand. The slug is built from the name by the controller.
 */
class BrandRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Brand|null $brand */
        $brand = $this->route('brand');

        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('brands', 'name')->ignore($brand?->id)],
        ];
    }
}
