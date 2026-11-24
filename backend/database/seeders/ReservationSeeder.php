<?php

namespace Database\Seeders;

use App\Enums\CarStatus;
use App\Enums\ExtraPricing;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\ReservationStatus;
use App\Enums\UserRole;
use App\Models\Car;
use App\Models\Extra;
use App\Models\Invoice;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\ReservationStatusHistory;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * About 60 reservations in every status, spread over past, current and future dates,
 * plus their invoices (paid for completed rentals, unpaid for some confirmed ones).
 *
 * Every car gets two reservations in windows that cannot overlap:
 *  - an older one, 32 to 90 days ago (completed, cancelled or rejected);
 *  - a recent one: in progress, upcoming, or finished in the last 3 weeks.
 * Cars in maintenance only get past reservations.
 *
 * Each reservation also gets its status history (reservation_status_histories), one
 * row per lifecycle timestamp: created by the customer, confirmed / refused / picked
 * up / returned by the agency's admin, cancelled by the customer (or, for one in
 * three, by the agency with a reason).
 */
class ReservationSeeder extends Seeder
{
    /**
     * @var list<string>
     */
    private const REJECTION_REASONS = [
        'Véhicule indisponible pour ces dates.',
        'Permis de conduire de moins de 2 ans.',
        'Documents incomplets : merci de fournir une copie de la CIN.',
        'Caution non autorisée par la banque.',
    ];

    /**
     * @var list<string>
     */
    private const CUSTOMER_NOTES = [
        'Arrivée par le vol AT 405, merci de m’attendre au terminal.',
        'Je souhaite un véhicule avec le plein fait, merci.',
        'Possible de récupérer la voiture 30 minutes plus tôt ?',
        'Voyage en famille avec deux enfants.',
        'Je paierai la caution par carte bancaire.',
    ];

    /**
     * @var list<string>
     */
    private const ADMIN_NOTES = [
        'Client fidèle, préparer le véhicule en priorité.',
        'Vérifier le permis à la remise des clés.',
        'Rayure légère sur le pare-choc arrière constatée au départ.',
    ];

    /**
     * Reason given when the agency cancels a reservation.
     */
    private const AGENCY_CANCELLATION_REASON = 'Véhicule immobilisé pour un entretien imprévu. Le client a été prévenu par téléphone.';

    /**
     * Pick-up hours offered by the agency.
     *
     * @var list<array{0: int, 1: int}>
     */
    private const PICKUP_TIMES = [[9, 0], [10, 0], [11, 30], [14, 0], [15, 30], [18, 0]];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $today = CarbonImmutable::today();
        $cars = Car::orderBy('id')->get();
        $extras = Extra::orderBy('id')->get();
        $locationIds = Location::orderBy('id')->pluck('id')->all();
        $demoClient = User::where('email', UserSeeder::CLIENT_EMAIL)->firstOrFail();
        $admin = User::where('role', UserRole::Admin)->orderBy('id')->firstOrFail();
        $clients = User::where('role', UserRole::Client)
            ->where('is_active', true)
            ->whereKeyNot($demoClient->id)
            ->orderBy('id')
            ->get()
            ->filter(fn (User $client): bool => $client->hasValidLicense())
            ->values();

        $plans = [];

        foreach ($cars as $index => $car) {
            $plans[] = $this->olderReservation($car, $today);
            $plans[] = $this->recentReservation($car, $index, $today);
        }

        foreach ($plans as $index => &$plan) {
            $plan['user'] = $index % 9 === 1 ? $demoClient : fake()->randomElement($clients->all());
            $plan['return_location_id'] = fake()->boolean(20)
                ? fake()->randomElement($locationIds)
                : $plan['car']->location_id;
        }
        unset($plan);

        usort($plans, fn (array $a, array $b): int => $a['created_at'] <=> $b['created_at']);

        $reservations = collect($plans)->map(fn (array $plan): Reservation => $this->createReservation($plan, $extras));

        $reservations->each(fn (Reservation $reservation) => $this->createHistory($reservation, $admin));

        $this->createInvoices($reservations);
    }

    /**
     * A reservation that started 32 to 90 days ago and is over.
     *
     * @return array<string, mixed>
     */
    private function olderReservation(Car $car, CarbonImmutable $today): array
    {
        $start = $this->atPickupTime($today->subDays(fake()->numberBetween(40, 90)));

        return $this->plan($car, $start, fake()->numberBetween(2, 8), $this->weightedStatus([
            ReservationStatus::Completed->value => 70,
            ReservationStatus::Cancelled->value => 20,
            ReservationStatus::Rejected->value => 10,
        ]));
    }

    /**
     * A reservation in progress, upcoming, or finished in the last three weeks.
     *
     * @return array<string, mixed>
     */
    private function recentReservation(Car $car, int $index, CarbonImmutable $today): array
    {
        $scenario = $car->status === CarStatus::Available ? $index % 4 : 3;

        return match ($scenario) {
            0 => $this->plan(
                $car,
                $this->atPickupTime($today->subDays($daysAgo = fake()->numberBetween(1, 3))),
                $daysAgo + fake()->numberBetween(1, 5),
                ReservationStatus::Active,
            ),
            1 => $this->plan(
                $car,
                $this->atPickupTime($today->addDays(fake()->numberBetween(2, 20))),
                fake()->numberBetween(2, 10),
                $this->weightedStatus([
                    ReservationStatus::Confirmed->value => 60,
                    ReservationStatus::Pending->value => 40,
                ]),
            ),
            2 => $this->plan(
                $car,
                $this->atPickupTime($today->addDays(fake()->numberBetween(10, 45))),
                fake()->numberBetween(3, 14),
                $this->weightedStatus([
                    ReservationStatus::Pending->value => 50,
                    ReservationStatus::Confirmed->value => 25,
                    ReservationStatus::Cancelled->value => 15,
                    ReservationStatus::Rejected->value => 10,
                ]),
            ),
            default => $this->plan(
                $car,
                $this->atPickupTime($today->subDays(fake()->numberBetween(12, 20))),
                fake()->numberBetween(2, 6),
                $this->weightedStatus([
                    ReservationStatus::Completed->value => 80,
                    ReservationStatus::Cancelled->value => 20,
                ]),
            ),
        };
    }

    /**
     * Dates, status and lifecycle timestamps of a reservation.
     *
     * Past events are capped at the start of today (not "now"), so seeding twice on
     * the same day gives identical data.
     *
     * @return array<string, mixed>
     */
    private function plan(Car $car, CarbonImmutable $start, int $days, ReservationStatus $status): array
    {
        $end = $start->addDays($days);
        $cutoff = CarbonImmutable::today();
        $createdAt = $start->subDays(fake()->numberBetween(3, 25))->setTime(fake()->numberBetween(8, 22), fake()->numberBetween(0, 59));
        $createdAt = $createdAt->min($cutoff->subHours(2));
        $confirmedAt = in_array($status, [ReservationStatus::Confirmed, ReservationStatus::Active, ReservationStatus::Completed], true)
            ? $createdAt->addHours(fake()->numberBetween(1, 12))->min($cutoff->subHour())
            : null;
        $cancelledAt = $status === ReservationStatus::Cancelled
            ? $createdAt->addHours(fake()->numberBetween(2, 48))->min($start->subHour())->min($cutoff)
            : null;
        $rejectedAt = $status === ReservationStatus::Rejected
            ? $createdAt->addHours(fake()->numberBetween(1, 24))->min($cutoff)
            : null;

        return [
            'car' => $car,
            'start_at' => $start,
            'end_at' => $end,
            'days' => $days,
            'status' => $status,
            'created_at' => $createdAt,
            'confirmed_at' => $confirmedAt,
            'picked_up_at' => in_array($status, [ReservationStatus::Active, ReservationStatus::Completed], true) ? $start : null,
            'returned_at' => $status === ReservationStatus::Completed ? $end : null,
            'cancelled_at' => $cancelledAt,
            'rejected_at' => $rejectedAt,
            'rejection_reason' => $rejectedAt ? fake()->randomElement(self::REJECTION_REASONS) : null,
            'updated_at' => collect([$createdAt, $confirmedAt, $cancelledAt, $rejectedAt])
                ->push($status === ReservationStatus::Active ? $start : null)
                ->push($status === ReservationStatus::Completed ? $end : null)
                ->filter()
                ->max(),
        ];
    }

    /**
     * Insert the reservation with its extras and consistent totals.
     *
     * @param  array<string, mixed>  $plan
     * @param  Collection<int, Extra>  $extras
     */
    private function createReservation(array $plan, Collection $extras): Reservation
    {
        /** @var Car $car */
        $car = $plan['car'];
        $days = $plan['days'];

        $chosenExtras = collect(fake()->randomElements($extras->all(), fake()->randomElement([0, 0, 1, 1, 2, 3])))
            ->map(function (Extra $extra) use ($days): array {
                $quantity = fake()->numberBetween(1, $extra->max_quantity);
                $multiplier = $extra->pricing === ExtraPricing::PerDay ? $quantity * $days : $quantity;

                return [
                    'extra' => $extra,
                    'quantity' => $quantity,
                    'unit_price' => (string) $extra->price,
                    'total' => bcmul((string) $extra->price, (string) $multiplier, 2),
                ];
            });

        $extrasTotal = $chosenExtras->reduce(fn (string $sum, array $line): string => bcadd($sum, $line['total'], 2), '0.00');
        $oneWayFee = $plan['return_location_id'] === $car->location_id
            ? '0.00'
            : bcadd((string) config('tomobilti.booking.one_way_fee'), '0', 2);

        $reservation = new Reservation([
            'user_id' => $plan['user']->id,
            'car_id' => $car->id,
            'pickup_location_id' => $car->location_id,
            'return_location_id' => $plan['return_location_id'],
            'start_at' => $plan['start_at'],
            'end_at' => $plan['end_at'],
            'days' => $days,
            'price_per_day' => (string) $car->price_per_day,
            'extras_total' => $extrasTotal,
            'one_way_fee' => $oneWayFee,
            'total' => bcadd(bcadd(bcmul((string) $car->price_per_day, (string) $days, 2), $extrasTotal, 2), $oneWayFee, 2),
            'deposit_amount' => (string) $car->deposit_amount,
            'status' => $plan['status'],
            'customer_notes' => fake()->boolean(30) ? fake()->randomElement(self::CUSTOMER_NOTES) : null,
            'admin_notes' => fake()->boolean(15) ? fake()->randomElement(self::ADMIN_NOTES) : null,
            'rejection_reason' => $plan['rejection_reason'],
            'confirmed_at' => $plan['confirmed_at'],
            'picked_up_at' => $plan['picked_up_at'],
            'returned_at' => $plan['returned_at'],
            'cancelled_at' => $plan['cancelled_at'],
            'rejected_at' => $plan['rejected_at'],
        ]);
        $reservation->created_at = $plan['created_at'];
        $reservation->updated_at = $plan['updated_at'];
        $reservation->save();

        foreach ($chosenExtras as $line) {
            $reservation->extras()->attach($line['extra']->id, [
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'pricing' => $line['extra']->pricing,
                'total' => $line['total'],
            ]);
        }

        return $reservation;
    }

    /**
     * History rows matching the lifecycle timestamps. One cancellation in three is the
     * agency's (with a reason): the row's author is the admin, and the reason is saved.
     */
    private function createHistory(Reservation $reservation, User $admin): void
    {
        $agencyCancels = $reservation->status === ReservationStatus::Cancelled && $reservation->id % 3 === 0;

        if ($agencyCancels) {
            $reservation->forceFill(['cancellation_reason' => self::AGENCY_CANCELLATION_REASON])->saveQuietly();
        }

        $steps = [[null, ReservationStatus::Pending, $reservation->user_id, null, $reservation->created_at]];
        $previous = ReservationStatus::Pending;

        foreach ([
            [ReservationStatus::Confirmed, $reservation->confirmed_at, $admin->id, null],
            [ReservationStatus::Active, $reservation->picked_up_at, $admin->id, null],
            [ReservationStatus::Completed, $reservation->returned_at, $admin->id, null],
            [ReservationStatus::Rejected, $reservation->rejected_at, $admin->id, $reservation->rejection_reason],
            [ReservationStatus::Cancelled, $reservation->cancelled_at, $agencyCancels ? $admin->id : $reservation->user_id, $reservation->cancellation_reason],
        ] as [$status, $at, $userId, $note]) {
            if ($at === null) {
                continue;
            }

            $steps[] = [$previous, $status, $userId, $note, $at];
            $previous = $status;
        }

        ReservationStatusHistory::insert(array_map(fn (array $step): array => [
            'reservation_id' => $reservation->id,
            'from_status' => $step[0]?->value,
            'to_status' => $step[1]->value,
            'user_id' => $step[2],
            'note' => $step[3],
            'created_at' => $step[4],
        ], $steps));
    }

    /**
     * Paid invoices for completed rentals, unpaid ones for every other confirmed booking.
     * Created in chronological order so invoice numbers follow the issue dates.
     *
     * @param  Collection<int, Reservation>  $reservations
     */
    private function createInvoices(Collection $reservations): void
    {
        $confirmedIndex = 0;

        $reservations
            ->filter(function (Reservation $reservation) use (&$confirmedIndex): bool {
                return match ($reservation->status) {
                    ReservationStatus::Completed => true,
                    ReservationStatus::Confirmed => $confirmedIndex++ % 2 === 0,
                    default => false,
                };
            })
            ->map(fn (Reservation $reservation): array => [
                'reservation' => $reservation,
                'issued_at' => $reservation->status === ReservationStatus::Completed
                    ? $reservation->returned_at
                    : $reservation->confirmed_at,
            ])
            ->sortBy(fn (array $item) => $item['issued_at']->getTimestamp())
            ->each(function (array $item): void {
                $reservation = $item['reservation'];
                $isPaid = $reservation->status === ReservationStatus::Completed;

                $invoice = new Invoice([
                    'reservation_id' => $reservation->id,
                    'issued_at' => $item['issued_at'],
                    ...Invoice::splitTotal((string) $reservation->total),
                    'vat_rate' => Invoice::DEFAULT_VAT_RATE,
                    'status' => $isPaid ? InvoiceStatus::Paid : InvoiceStatus::Unpaid,
                    'paid_at' => $isPaid ? $item['issued_at'] : null,
                    'payment_method' => $isPaid ? fake()->randomElement(PaymentMethod::cases()) : null,
                ]);
                $invoice->created_at = $item['issued_at'];
                $invoice->updated_at = $item['issued_at'];
                $invoice->save();
            });
    }

    /**
     * @param  array<string, int>  $weights  status value => weight
     */
    private function weightedStatus(array $weights): ReservationStatus
    {
        $roll = fake()->numberBetween(1, array_sum($weights));

        foreach ($weights as $status => $weight) {
            if (($roll -= $weight) <= 0) {
                return ReservationStatus::from($status);
            }
        }

        return ReservationStatus::from(array_key_last($weights));
    }

    private function atPickupTime(CarbonImmutable $day): CarbonImmutable
    {
        [$hour, $minute] = fake()->randomElement(self::PICKUP_TIMES);

        return $day->setTime($hour, $minute);
    }
}
