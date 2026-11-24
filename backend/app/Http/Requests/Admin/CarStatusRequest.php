<?php

namespace App\Http\Requests\Admin;

use App\Enums\CarStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * PATCH /api/admin/cars/{car}/status { status, force? }. Without `force`, a change
 * that affects upcoming reservations answers 409 with the list (see CarStatusController).
 */
class CarStatusRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(CarStatus::class)],
            'force' => ['sometimes', 'boolean'],
        ];
    }
}
