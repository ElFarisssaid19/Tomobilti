<?php

namespace App\Exceptions;

use App\Services\EligibilityResult;
use Exception;
use Illuminate\Http\JsonResponse;

/**
 * A booking that cannot be made, rendered as JSON with a French message:
 *
 *  - 409 when the car was booked by someone else for overlapping times;
 *  - 422 when the customer cannot book yet (with the eligibility details).
 */
class BookingException extends Exception
{
    /**
     * @param  array<string, mixed>  $extra  additional keys of the JSON body
     */
    public function __construct(string $message, private int $status, private array $extra = [])
    {
        parent::__construct($message);
    }

    public static function carUnavailable(): self
    {
        return new self(__('api.booking.unavailable'), 409, ['code' => 'car_unavailable']);
    }

    public static function notEligible(EligibilityResult $eligibility): self
    {
        return new self($eligibility->reasons[0]['message'], 422, [
            'code' => 'not_eligible',
            'eligibility' => $eligibility->toArray(),
        ]);
    }

    public function status(): int
    {
        return $this->status;
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage(), ...$this->extra], $this->status);
    }
}
