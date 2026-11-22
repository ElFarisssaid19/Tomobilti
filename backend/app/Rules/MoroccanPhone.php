<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

/**
 * Moroccan phone number, stored in E.164 format: +212 followed by 9 digits,
 * starting with 5 (landline), 6 or 7 (mobile). Example: +212661234567.
 *
 * Form requests call MoroccanPhone::normalize() in prepareForValidation(), so
 * users may type "06 61 23 45 67", "0661-234567" or "00212 661 234 567".
 */
class MoroccanPhone implements ValidationRule
{
    public const PATTERN = '/^\+212[5-7]\d{8}$/';

    /**
     * Convert the usual local spellings to E.164. Other values are returned
     * without separators and are then rejected by validate().
     */
    public static function normalize(mixed $value): mixed
    {
        if (! is_string($value) || trim($value) === '') {
            return $value;
        }

        $digits = preg_replace('/[\s.\-()]/', '', $value);

        return match (true) {
            str_starts_with($digits, '00212') => '+212'.substr($digits, 5),
            str_starts_with($digits, '212') => '+'.$digits,
            str_starts_with($digits, '0') => '+212'.substr($digits, 1),
            default => $digits,
        };
    }

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || preg_match(self::PATTERN, $value) !== 1) {
            $fail(__('api.validation.phone'));
        }
    }
}
