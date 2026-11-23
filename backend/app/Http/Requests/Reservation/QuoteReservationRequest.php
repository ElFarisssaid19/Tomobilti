<?php

namespace App\Http\Requests\Reservation;

use App\Enums\CarStatus;
use App\Models\Car;
use App\Models\Extra;
use App\Models\Location;
use App\Services\ReservationPricing;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Input of a booking (POST /api/reservations/quote and POST /api/reservations).
 *
 *   car              slug of an available car
 *   start_at, end_at "YYYY-MM-DD HH:MM", agency time (Africa/Casablanca)
 *   pickup_location  slug of an active agency
 *   return_location  slug of an active agency (a different one adds the one-way fee)
 *   extras           [{ slug, quantity }], each extra once, 1 ≤ quantity ≤ max_quantity
 *
 * Booking rules (config/tomobilti.php "booking"): times between 08:00 and 20:00 in
 * 30-minute slots, pick-up at least 2 hours from now and at most 6 months ahead,
 * 1 to 30 billed days. No price is ever read from the request.
 */
class QuoteReservationRequest extends FormRequest
{
    private const DATE_FORMAT = 'Y-m-d H:i';

    /** @var Collection<string, Extra>|null */
    private ?Collection $extraModels = null;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $activeLocation = Rule::exists(Location::class, 'slug')->where('is_active', true);

        return [
            'car' => ['required', 'string', Rule::exists(Car::class, 'slug')->where('status', CarStatus::Available->value)->withoutTrashed()],
            'start_at' => ['required', 'date_format:'.self::DATE_FORMAT],
            'end_at' => ['required', 'date_format:'.self::DATE_FORMAT, 'after:start_at'],
            'pickup_location' => ['required', 'string', $activeLocation],
            'return_location' => ['required', 'string', $activeLocation],
            'extras' => ['sometimes', 'array', 'max:20'],
            'extras.*' => ['array:slug,quantity'],
            'extras.*.slug' => ['required', 'string', 'distinct', Rule::exists(Extra::class, 'slug')->where('is_active', true)],
            'extras.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Rules that need the parsed dates or the extras: time slots, lead time, how far
     * ahead, duration and the maximum quantity of each extra.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['start_at', 'end_at'])) {
                    return;
                }

                $this->validateDates($validator);
            },
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['extras', 'extras.*'])) {
                    return;
                }

                foreach ($this->input('extras', []) as $index => $selection) {
                    $extra = $this->extraModels()->get($selection['slug'] ?? null);

                    if ($extra && (int) ($selection['quantity'] ?? 0) > $extra->max_quantity) {
                        $validator->errors()->add("extras.{$index}.quantity", __('api.booking.extra_max_quantity', [
                            'extra' => $extra->name,
                            'max' => $extra->max_quantity,
                        ]));
                    }
                }
            },
        ];
    }

    private function validateDates(Validator $validator): void
    {
        $rules = config('tomobilti.booking');
        $start = $this->startAt();
        $end = $this->endAt();

        foreach (['start_at' => $start, 'end_at' => $end] as $field => $moment) {
            if (! $this->isOpeningSlot($moment)) {
                $validator->errors()->add($field, __('api.booking.time_slot', [
                    'open' => $rules['opening_time'],
                    'close' => $rules['closing_time'],
                    'minutes' => $rules['slot_minutes'],
                ]));
            }
        }

        if ($start->isPast()) {
            $validator->errors()->add('start_at', __('api.booking.start_in_past'));
        } elseif ($start->lessThan(now()->addHours($rules['min_lead_hours']))) {
            $validator->errors()->add('start_at', __('api.booking.lead_time', ['hours' => $rules['min_lead_hours']]));
        } elseif ($start->greaterThan(now()->addMonths($rules['max_advance_months']))) {
            $validator->errors()->add('start_at', __('api.booking.too_far', ['months' => $rules['max_advance_months']]));
        }

        if ($end->greaterThan($start) && app(ReservationPricing::class)->billedDays($start, $end) > $rules['max_days']) {
            $validator->errors()->add('end_at', __('api.booking.max_days', ['days' => $rules['max_days']]));
        }
    }

    /**
     * Whether the time is one of the slots offered at the counter (08:00, 08:30 … 20:00).
     */
    private function isOpeningSlot(CarbonImmutable $moment): bool
    {
        $rules = config('tomobilti.booking');
        $minutes = $moment->hour * 60 + $moment->minute;
        [$openHour, $openMinute] = array_map('intval', explode(':', $rules['opening_time']));
        [$closeHour, $closeMinute] = array_map('intval', explode(':', $rules['closing_time']));
        $open = $openHour * 60 + $openMinute;
        $close = $closeHour * 60 + $closeMinute;

        return $minutes >= $open && $minutes <= $close && ($minutes - $open) % $rules['slot_minutes'] === 0;
    }

    public function car(): Car
    {
        return Car::query()->where('slug', $this->input('car'))->firstOrFail();
    }

    public function startAt(): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat(self::DATE_FORMAT, $this->input('start_at'))->startOfMinute();
    }

    public function endAt(): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat(self::DATE_FORMAT, $this->input('end_at'))->startOfMinute();
    }

    public function pickupLocation(): Location
    {
        return Location::query()->where('slug', $this->input('pickup_location'))->firstOrFail();
    }

    public function returnLocation(): Location
    {
        return Location::query()->where('slug', $this->input('return_location'))->firstOrFail();
    }

    /**
     * The chosen extras with their quantity, in the order they were sent.
     *
     * @return list<array{extra: Extra, quantity: int}>
     */
    public function extraSelections(): array
    {
        return array_map(fn (array $selection): array => [
            'extra' => $this->extraModels()->get($selection['slug']),
            'quantity' => (int) $selection['quantity'],
        ], array_values($this->validated('extras', [])));
    }

    /**
     * Active extras named in the request, keyed by slug (one query).
     *
     * @return Collection<string, Extra>
     */
    private function extraModels(): Collection
    {
        return $this->extraModels ??= Extra::query()
            ->active()
            ->whereIn('slug', collect($this->input('extras', []))->pluck('slug')->filter(fn ($slug) => is_string($slug))->all())
            ->get()
            ->keyBy('slug');
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'car.exists' => __('api.booking.car_unknown'),
            'start_at.date_format' => __('api.booking.date_format'),
            'end_at.date_format' => __('api.booking.date_format'),
            'end_at.after' => __('api.booking.end_before_start'),
            'pickup_location.exists' => __('api.booking.location_unknown'),
            'return_location.exists' => __('api.booking.location_unknown'),
            'extras.*.slug.exists' => __('api.booking.extra_unknown'),
            'extras.*.slug.distinct' => __('api.booking.extra_twice'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'car' => 'voiture',
            'start_at' => 'date de prise en charge',
            'end_at' => 'date de restitution',
            'pickup_location' => 'agence de prise en charge',
            'return_location' => 'agence de restitution',
            'extras' => 'options',
            'extras.*.slug' => 'option',
            'extras.*.quantity' => 'quantité',
        ];
    }
}
