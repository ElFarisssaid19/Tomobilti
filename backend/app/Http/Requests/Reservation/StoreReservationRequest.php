<?php

namespace App\Http\Requests\Reservation;

use Illuminate\Contracts\Validation\ValidationRule;

/**
 * POST /api/reservations: the quote input, plus the customer's notes and the
 * acceptance of the rental terms. Everything is validated again on submit.
 */
class StoreReservationRequest extends QuoteReservationRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'customer_notes' => ['nullable', 'string', 'max:1000'],
            'terms' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            ...parent::messages(),
            'terms.accepted' => __('api.validation.terms'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            ...parent::attributes(),
            'customer_notes' => 'remarques',
        ];
    }
}
