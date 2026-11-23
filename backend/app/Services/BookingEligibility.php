<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonInterface;

/**
 * Can this customer book a car for this pick-up date? Each failed rule adds a French
 * reason the SPA shows as it is:
 *
 *  1. the account is active;
 *  2. the email address is verified;
 *  3. the profile is complete (phone, birth date, CIN, licence number and date);
 *  4. the driver is at least 21 on the pick-up date;
 *  5. the licence is at least 2 years old on the pick-up date.
 *
 * Rules 4 and 5 are only checked when the dates they need are filled in; a missing
 * date is reported by rule 3 instead.
 */
class BookingEligibility
{
    /**
     * French names of the profile fields, for the "missing fields" message.
     *
     * @var array<string, string>
     */
    public const FIELD_LABELS = [
        'phone' => 'téléphone',
        'birth_date' => 'date de naissance',
        'cin' => 'numéro de CIN',
        'driving_license_number' => 'numéro de permis',
        'driving_license_issued_at' => 'date d’obtention du permis',
    ];

    public function check(User $user, CarbonInterface $pickupAt): EligibilityResult
    {
        $reasons = [];

        if (! $user->is_active) {
            $reasons[] = ['code' => 'account_inactive', 'message' => __('api.booking.eligibility.account_inactive')];
        }

        if (! $user->hasVerifiedEmail()) {
            $reasons[] = ['code' => 'email_unverified', 'message' => __('api.booking.eligibility.email_unverified')];
        }

        $missingFields = array_values(array_filter(
            User::BOOKING_PROFILE_FIELDS,
            fn (string $field): bool => blank($user->{$field}),
        ));

        if ($missingFields !== []) {
            $reasons[] = ['code' => 'profile_incomplete', 'message' => __('api.booking.eligibility.profile_incomplete', [
                'fields' => implode(', ', array_map(fn (string $field): string => self::FIELD_LABELS[$field], $missingFields)),
            ])];
        }

        $minAge = (int) config('tomobilti.booking.min_age');

        if ($user->birth_date && $user->birth_date->copy()->addYears($minAge)->greaterThan($pickupAt)) {
            $reasons[] = ['code' => 'under_age', 'message' => __('api.booking.eligibility.under_age', ['age' => $minAge])];
        }

        $minLicenseYears = (int) config('tomobilti.booking.min_license_years');
        $licenseOldEnoughOn = $user->driving_license_issued_at?->copy()->addYears($minLicenseYears);

        if ($licenseOldEnoughOn && $licenseOldEnoughOn->greaterThan($pickupAt)) {
            $reasons[] = ['code' => 'license_too_recent', 'message' => __('api.booking.eligibility.license_too_recent', [
                'years' => $minLicenseYears,
                'date' => $licenseOldEnoughOn->format('d/m/Y'),
            ])];
        }

        return new EligibilityResult($reasons, $missingFields);
    }
}
