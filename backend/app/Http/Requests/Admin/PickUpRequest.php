<?php

namespace App\Http\Requests\Admin;

use App\Enums\PaymentMethod;
use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * "Marquer comme récupérée": the customer pays at the agency, so the agency says how
 * (espèces, carte, virement) and whether it is paid now. The invoice is issued with it.
 *
 * The policy runs before the validation, so a move the status does not allow still
 * answers 403 with its French reason, whatever the body.
 */
class PickUpRequest extends FormRequest
{
    public function authorize(): Response
    {
        return Gate::inspect('markPickedUp', $this->route('reservation'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'paid' => ['required', 'boolean'],
        ];
    }

    public function paymentMethod(): PaymentMethod
    {
        return PaymentMethod::from($this->validated('payment_method'));
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['payment_method' => 'mode de paiement', 'paid' => 'paiement'];
    }
}
