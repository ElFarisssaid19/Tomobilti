<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Query string of the back-office clients table (GET /api/admin/clients).
 */
class ClientIndexRequest extends FormRequest
{
    /**
     * Sortable columns.
     *
     * @var list<string>
     */
    public const SORTS = ['name', 'created_at', 'reservations_count', 'reservations_sum_total'];

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'active' => ['nullable', Rule::in(['0', '1'])],
            'verified' => ['nullable', Rule::in(['0', '1'])],
            'sort' => ['nullable', Rule::in(self::SORTS)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
