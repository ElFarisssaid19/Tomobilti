<?php

namespace App\Http\Requests\Admin;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * GET /api/admin/planning?from=YYYY-MM-DD&to=YYYY-MM-DD (both days included,
 * MAX_DAYS at most). Defaults: this week and the next one (14 days from Monday).
 */
class PlanningRequest extends FormRequest
{
    public const MAX_DAYS = 31;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            if ($this->from()->diffInDays($this->to()) + 1 > self::MAX_DAYS) {
                $validator->errors()->add('to', __('api.admin.reservations.planning_range', ['days' => self::MAX_DAYS]));
            }
        }];
    }

    public function from(): CarbonImmutable
    {
        return $this->filled('from')
            ? CarbonImmutable::parse($this->input('from'))->startOfDay()
            : CarbonImmutable::today()->startOfWeek();
    }

    /**
     * The last day shown (included).
     */
    public function to(): CarbonImmutable
    {
        return $this->filled('to')
            ? CarbonImmutable::parse($this->input('to'))->startOfDay()
            : $this->from()->addDays(13);
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['from' => 'date de début', 'to' => 'date de fin'];
    }
}
