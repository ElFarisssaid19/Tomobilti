<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create or edit a category. The slug is built from the name by the controller.
 */
class CategoryRequest extends FormRequest
{
    /**
     * lucide icon names are lowercase words joined by hyphens ("car-front").
     */
    public const ICON_PATTERN = '/^[a-z0-9]+(-[a-z0-9]+)*$/';

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Category|null $category */
        $category = $this->route('category');

        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('categories', 'name')->ignore($category?->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:50', 'regex:'.self::ICON_PATTERN],
            'sort_order' => ['required', 'integer', 'min:0', 'max:999'],
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
        return ['icon' => 'icône', 'sort_order' => 'ordre d’affichage'];
    }
}
