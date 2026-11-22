<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Rules\MoroccanPhone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Registration form of a customer. There is no "role" field: every new account
 * is a client (the role is not mass assignable on the User model either).
 */
class RegisterRequest extends FormRequest
{
    /**
     * Clean the input before validating: lowercase email, phone in E.164 format.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => is_string($this->email) ? Str::lower(trim($this->email)) : $this->email,
            'phone' => MoroccanPhone::normalize($this->phone),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'phone' => ['required', 'string', new MoroccanPhone],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            'terms' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => __('api.validation.email_taken'),
            'terms.accepted' => __('api.validation.terms'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nom complet',
            'phone' => 'téléphone',
        ];
    }
}
