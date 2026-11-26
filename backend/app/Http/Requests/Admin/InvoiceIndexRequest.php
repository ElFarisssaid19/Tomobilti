<?php

namespace App\Http\Requests\Admin;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Filters\AdminInvoiceFilter;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Query string of the back-office invoices list (GET /api/admin/invoices).
 */
class InvoiceIndexRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::enum(InvoiceStatus::class)],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'q' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', Rule::in(AdminInvoiceFilter::SORTS)],
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
        return ['from' => 'date de début', 'to' => 'date de fin', 'payment_method' => 'mode de paiement'];
    }
}
