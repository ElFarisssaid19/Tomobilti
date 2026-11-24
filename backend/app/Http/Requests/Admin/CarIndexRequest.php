<?php

namespace App\Http\Requests\Admin;

use App\Enums\CarStatus;
use App\Filters\AdminCarFilter;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Query string of the back-office fleet table (GET /api/admin/cars).
 */
class CarIndexRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(CarStatus::class)],
            'category' => ['nullable', 'integer'],
            'brand' => ['nullable', 'integer'],
            'location' => ['nullable', 'integer'],
            'deleted' => ['nullable', Rule::in(['without', 'with', 'only'])],
            'sort' => ['nullable', Rule::in(AdminCarFilter::SORTS)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
