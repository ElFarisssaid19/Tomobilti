<?php

namespace Database\Factories;

use App\Enums\ReservationStatus;
use App\Models\Car;
use App\Models\Reservation;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * Reservations with consistent snapshots: price_per_day and deposit come from the car,
 * total = days × price_per_day + extras_total + one_way_fee (when the return agency differs).
 *
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = now()->addDays(fake()->numberBetween(3, 30))->setTime(10, 0);
        $days = fake()->numberBetween(1, 7);

        return [
            'user_id' => User::factory(),
            'car_id' => Car::factory(),
            'pickup_location_id' => fn (array $attributes) => $this->car($attributes)->location_id,
            'return_location_id' => fn (array $attributes) => $attributes['pickup_location_id'],
            'start_at' => $start,
            'end_at' => $start->copy()->addDays($days),
            'days' => $days,
            'price_per_day' => fn (array $attributes) => $this->car($attributes)->price_per_day,
            'extras_total' => '0.00',
            'one_way_fee' => fn (array $attributes) => $attributes['return_location_id'] === $attributes['pickup_location_id']
                ? '0.00'
                : bcadd((string) config('tomobilti.booking.one_way_fee'), '0', 2),
            'total' => fn (array $attributes) => bcadd(
                bcadd(bcmul((string) $attributes['price_per_day'], (string) $attributes['days'], 2), (string) $attributes['extras_total'], 2),
                (string) $attributes['one_way_fee'],
                2,
            ),
            'deposit_amount' => fn (array $attributes) => $this->car($attributes)->deposit_amount,
            'status' => ReservationStatus::Pending,
        ];
    }

    /**
     * Book the car for the given period (days are rounded up to whole days).
     */
    public function between(DateTimeInterface|string $start, DateTimeInterface|string $end): static
    {
        $start = Carbon::parse($start);
        $end = Carbon::parse($end);

        return $this->state(fn (array $attributes) => [
            'start_at' => $start,
            'end_at' => $end,
            'days' => max(1, (int) ceil($start->diffInMinutes($end) / (24 * 60))),
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReservationStatus::Pending,
        ]);
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReservationStatus::Confirmed,
            'confirmed_at' => now()->subHour(),
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReservationStatus::Active,
            'confirmed_at' => Carbon::parse($attributes['start_at'])->subDay(),
            'picked_up_at' => $attributes['start_at'],
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReservationStatus::Completed,
            'confirmed_at' => Carbon::parse($attributes['start_at'])->subDay(),
            'picked_up_at' => $attributes['start_at'],
            'returned_at' => $attributes['end_at'],
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReservationStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReservationStatus::Rejected,
            'rejection_reason' => 'Véhicule indisponible pour ces dates.',
            'rejected_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function car(array $attributes): Car
    {
        return Car::withTrashed()->findOrFail($attributes['car_id']);
    }
}
