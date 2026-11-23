<?php

namespace App\Services;

use App\Enums\ReservationStatus;
use App\Exceptions\BookingException;
use App\Models\Car;
use App\Models\Extra;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * Creates a pending reservation without ever double-booking a car.
 *
 * Inside one database transaction:
 *   1. lock the car row (SELECT … FOR UPDATE): a second booking of the same car
 *      waits here until the first transaction ends;
 *   2. check availability again, now that nobody else can book this car;
 *   3. save the reservation with its price snapshots and its extras.
 *
 * So when two customers confirm the same car for overlapping times at the same
 * moment, the second one sees the first reservation in step 2 and gets a 409.
 */
class ReservationBooker
{
    /**
     * Attempts when two reservations of different cars get the same reference
     * (unique index) at the same moment.
     */
    private const REFERENCE_ATTEMPTS = 3;

    public function __construct(private ReservationPricing $pricing) {}

    /**
     * @param  list<array{extra: Extra, quantity: int}>  $extras
     *
     * @throws BookingException when the car is no longer available for these times
     */
    public function book(
        User $user,
        Car $car,
        CarbonInterface $start,
        CarbonInterface $end,
        Location $pickupLocation,
        Location $returnLocation,
        array $extras = [],
        ?string $customerNotes = null,
    ): Reservation {
        for ($attempt = 1; ; $attempt++) {
            try {
                return DB::transaction(function () use ($user, $car, $start, $end, $pickupLocation, $returnLocation, $extras, $customerNotes): Reservation {
                    $lockedCar = Car::query()->whereKey($car->getKey())->lockForUpdate()->firstOrFail();

                    if (! $lockedCar->isAvailableBetween($start, $end)) {
                        throw BookingException::carUnavailable();
                    }

                    $price = $this->pricing->quote($lockedCar, $start, $end, $pickupLocation, $returnLocation, $extras);

                    $reservation = Reservation::create([
                        'user_id' => $user->id,
                        'car_id' => $lockedCar->id,
                        'pickup_location_id' => $pickupLocation->id,
                        'return_location_id' => $returnLocation->id,
                        'start_at' => $start,
                        'end_at' => $end,
                        'days' => $price->days,
                        'price_per_day' => $price->pricePerDay,
                        'extras_total' => $price->extrasTotal,
                        'one_way_fee' => $price->oneWayFee,
                        'total' => $price->total,
                        'deposit_amount' => $price->depositAmount,
                        'status' => ReservationStatus::Pending,
                        'customer_notes' => $customerNotes,
                    ]);

                    foreach ($price->extras as $line) {
                        $reservation->extras()->attach($line['extra_id'], [
                            'quantity' => $line['quantity'],
                            'unit_price' => $line['unit_price'],
                            'pricing' => $line['pricing'],
                            'total' => $line['total'],
                        ]);
                    }

                    return $reservation;
                });
            } catch (UniqueConstraintViolationException $exception) {
                if ($attempt >= self::REFERENCE_ATTEMPTS) {
                    throw $exception;
                }
            }
        }
    }
}
