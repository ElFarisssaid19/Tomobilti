<?php

namespace App\Exceptions;

use App\Enums\CarStatus;
use App\Enums\ReservationStatus;
use Exception;
use Illuminate\Http\JsonResponse;

/**
 * A status change that cannot happen right now, rendered as a 409 with a French
 * message. The policies already refuse impossible transitions (403); this covers
 * what changed in between, checked again under a row lock by ReservationWorkflow:
 *
 *  - the reservation's status changed meanwhile (e.g. it expired);
 *  - the car cannot be rented any more, or another reservation overlaps it (confirm).
 */
class ReservationTransitionException extends Exception
{
    /**
     * @param  array<string, mixed>  $extra  additional keys of the JSON body
     */
    public function __construct(string $message, private string $errorCode, private array $extra = [])
    {
        parent::__construct($message);
    }

    public static function notAllowed(ReservationStatus $from, ReservationStatus $to): self
    {
        return new self(self::notAllowedMessage($from, $to), 'transition_not_allowed');
    }

    /**
     * "Impossible de confirmer une réservation « terminée »."
     */
    public static function notAllowedMessage(ReservationStatus $from, ReservationStatus $to): string
    {
        return __('api.admin.reservations.not_allowed', [
            'action' => __("api.admin.reservations.verbs.{$to->value}"),
            'status' => mb_strtolower($from->label()),
        ]);
    }

    public static function carRemoved(): self
    {
        return new self(__('api.admin.reservations.car_removed'), 'car_unavailable');
    }

    public static function carNotRentable(CarStatus $status): self
    {
        return new self(
            __('api.admin.reservations.car_not_rentable', ['status' => mb_strtolower($status->label())]),
            'car_unavailable',
        );
    }

    public static function overlap(string $reference): self
    {
        return new self(
            __('api.admin.reservations.overlap', ['reference' => $reference]),
            'reservation_overlap',
            ['conflict' => $reference],
        );
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage(), 'code' => $this->errorCode, ...$this->extra], 409);
    }
}
