<?php

namespace App\Http\Requests\Admin;

use App\Enums\AdminReservationTab;
use App\Enums\ReservationStatus;
use App\Filters\AdminReservationFilter;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Query string of the back-office reservations list and of its CSV export.
 * `status` may be "confirmed,active" (what the SPA sends) or "status[]=…".
 */
class ReservationIndexRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('status'))) {
            $this->merge(['status' => array_values(array_filter(array_map('trim', explode(',', $this->input('status')))))]);
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
            'tab' => ['nullable', Rule::enum(AdminReservationTab::class)],
            'status' => ['nullable', 'array', 'max:6'],
            'status.*' => [Rule::enum(ReservationStatus::class)],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'car' => ['nullable', 'integer'],
            'location' => ['nullable', 'integer'],
            'q' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', Rule::in(AdminReservationFilter::SORTS)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['from' => 'date de début', 'to' => 'date de fin', 'car' => 'voiture', 'location' => 'agence'];
    }
}
