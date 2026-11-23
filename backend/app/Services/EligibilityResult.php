<?php

namespace App\Services;

/**
 * Outcome of BookingEligibility: eligible when no reason was found.
 */
final readonly class EligibilityResult
{
    /**
     * @param  list<array{code: string, message: string}>  $reasons
     * @param  list<string>  $missingFields  profile fields to fill in (User::BOOKING_PROFILE_FIELDS)
     */
    public function __construct(
        public array $reasons,
        public array $missingFields,
    ) {}

    public function isEligible(): bool
    {
        return $this->reasons === [];
    }

    public function has(string $code): bool
    {
        return in_array($code, array_column($this->reasons, 'code'), true);
    }

    /**
     * @return array{eligible: bool, reasons: list<array{code: string, message: string}>, missing_fields: list<string>}
     */
    public function toArray(): array
    {
        return [
            'eligible' => $this->isEligible(),
            'reasons' => $this->reasons,
            'missing_fields' => $this->missingFields,
        ];
    }
}
