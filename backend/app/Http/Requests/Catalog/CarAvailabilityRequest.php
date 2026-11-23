<?php

namespace App\Http\Requests\Catalog;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Window of GET /api/cars/{slug}/availability?from=&to= (YYYY-MM-DD, both optional).
 * Defaults to today → today + 6 months, and never spans more than 6 months.
 */
class CarAvailabilityRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:'.($this->filled('from') ? 'from' : 'today')],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                if ($this->windowEnd()->greaterThan($this->windowStart()->addMonths($this->maxMonths()))) {
                    $validator->errors()->add('to', __('api.catalog.availability_window', ['months' => $this->maxMonths()]));
                }
            },
        ];
    }

    /**
     * First day of the window (today by default).
     */
    public function windowStart(): CarbonImmutable
    {
        return $this->filled('from')
            ? CarbonImmutable::createFromFormat('Y-m-d', $this->input('from'))->startOfDay()
            : CarbonImmutable::today();
    }

    /**
     * Last day of the window (6 months after the start by default).
     */
    public function windowEnd(): CarbonImmutable
    {
        return $this->filled('to')
            ? CarbonImmutable::createFromFormat('Y-m-d', $this->input('to'))->startOfDay()
            : $this->windowStart()->addMonths($this->maxMonths());
    }

    private function maxMonths(): int
    {
        return (int) config('tomobilti.catalog.availability_max_months');
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'to.after_or_equal' => __('api.catalog.window_end_before_start'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'from' => 'date de début',
            'to' => 'date de fin',
        ];
    }
}
