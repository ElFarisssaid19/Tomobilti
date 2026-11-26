<?php

namespace App\Http\Requests\Admin;

use App\Enums\PaymentMethod;
use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * An unpaid invoice settled later at the agency, with the payment method used.
 * An invoice already paid answers 403 (policy, checked before the validation).
 */
class MarkInvoicePaidRequest extends FormRequest
{
    public function authorize(): Response
    {
        return Gate::inspect('markPaid', $this->route('invoice'));
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
        return ['payment_method' => 'mode de paiement'];
    }
}
