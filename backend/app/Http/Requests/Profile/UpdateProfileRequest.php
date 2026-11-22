<?php

namespace App\Http\Requests\Profile;

use App\Models\User;
use App\Rules\MoroccanPhone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Customer profile. The SPA saves it in sections (personal information, then
 * driving licence and ID), so every field is optional in the request
 * ("sometimes"); name, email and phone cannot be emptied once sent.
 *
 * Rules: at least 18 years old; the licence cannot be issued in the future
 * nor before the 18th birthday.
 */
class UpdateProfileRequest extends FormRequest
{
    /**
     * Clean the input before validating.
     */
    protected function prepareForValidation(): void
    {
        $clean = [];

        if ($this->has('email') && is_string($this->email)) {
            $clean['email'] = Str::lower(trim($this->email));
        }

        if ($this->has('phone')) {
            $clean['phone'] = MoroccanPhone::normalize($this->phone);
        }

        if ($this->has('cin') && is_string($this->cin)) {
            $clean['cin'] = Str::upper(str_replace(' ', '', $this->cin));
        }

        $this->merge($clean);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $adultBirthdayLimit = Carbon::today()->subYears(User::MIN_AGE)->toDateString();

        return [
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique(User::class)->ignore($this->user())],
            'phone' => ['sometimes', 'required', 'string', new MoroccanPhone],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'birth_date' => ['sometimes', 'nullable', 'date', 'after:1900-01-01', "before_or_equal:{$adultBirthdayLimit}"],
            'cin' => ['sometimes', 'nullable', 'string', 'regex:/^[A-Z]{1,2}\d{4,6}$/', Rule::unique(User::class)->ignore($this->user())],
            'driving_license_number' => ['sometimes', 'nullable', 'string', 'max:30'],
            'driving_license_issued_at' => ['sometimes', 'nullable', 'date', 'before_or_equal:today'],
        ];
    }

    /**
     * The licence date must come after the 18th birthday. The birth date comes from
     * the request, or from the saved profile when this section does not send it.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['birth_date', 'driving_license_issued_at']) || blank($this->input('driving_license_issued_at'))) {
                    return;
                }

                $birthDate = $this->has('birth_date') ? $this->input('birth_date') : $this->user()->birth_date;

                if (blank($birthDate)) {
                    return;
                }

                $adultOn = Carbon::parse($birthDate)->addYears(User::MIN_AGE);

                if (Carbon::parse($this->input('driving_license_issued_at'))->lessThan($adultOn)) {
                    $validator->errors()->add('driving_license_issued_at', __('api.validation.license_before_adult'));
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => __('api.validation.email_taken'),
            'birth_date.before_or_equal' => __('api.validation.min_age', ['age' => User::MIN_AGE]),
            'cin.regex' => __('api.validation.cin'),
            'cin.unique' => __('api.validation.cin_taken'),
            'driving_license_issued_at.before_or_equal' => __('api.validation.license_in_future'),
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
            'birth_date' => 'date de naissance',
            'cin' => 'CIN',
            'driving_license_number' => 'numéro de permis',
            'driving_license_issued_at' => 'date d’obtention du permis',
        ];
    }
}
