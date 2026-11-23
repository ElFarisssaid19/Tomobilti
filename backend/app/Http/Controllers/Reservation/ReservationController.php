<?php

namespace App\Http\Controllers\Reservation;

use App\Enums\ReservationTab;
use App\Exceptions\BookingException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Resources\ReservationDetailResource;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\BookingEligibility;
use App\Services\ReservationBooker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * "Mes réservations": the signed-in customer's own reservations, and booking a car.
 */
class ReservationController extends Controller
{
    /**
     * GET /api/reservations?tab=upcoming|current|past|cancelled&page=: one tab, 10 per
     * page, with the number of reservations in every tab (meta.counts).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Reservation::class);

        $validated = $request->validate([
            'tab' => ['sometimes', Rule::enum(ReservationTab::class)],
        ]);

        $tab = ReservationTab::tryFrom($validated['tab'] ?? '') ?? ReservationTab::Upcoming;
        $mine = fn () => $request->user()->reservations();

        $reservations = $mine()
            ->inTab($tab)
            ->with(ReservationResource::RELATIONS)
            ->paginate(config('tomobilti.booking.per_page'))
            ->withQueryString();

        $counts = collect(ReservationTab::cases())
            ->mapWithKeys(fn (ReservationTab $case): array => [$case->value => $mine()->inTab($case)->count()]);

        return ReservationResource::collection($reservations)
            ->additional(['meta' => ['tab' => $tab->value, 'counts' => $counts]]);
    }

    /**
     * GET /api/reservations/{reference}: one of my reservations (404 for anyone else's).
     */
    public function show(Reservation $reservation): ReservationDetailResource
    {
        Gate::authorize('view', $reservation);

        return new ReservationDetailResource($reservation->load(ReservationDetailResource::RELATIONS));
    }

    /**
     * POST /api/reservations: validate everything again, check the customer can book,
     * then create a pending reservation (ReservationBooker locks the car row, so two
     * customers can never book the same car for overlapping times: 409).
     */
    public function store(
        StoreReservationRequest $request,
        BookingEligibility $eligibility,
        ReservationBooker $booker,
    ): JsonResponse {
        Gate::authorize('create', Reservation::class);

        $start = $request->startAt();
        $eligibilityResult = $eligibility->check($request->user(), $start);

        if (! $eligibilityResult->isEligible()) {
            throw BookingException::notEligible($eligibilityResult);
        }

        $reservation = $booker->book(
            user: $request->user(),
            car: $request->car(),
            start: $start,
            end: $request->endAt(),
            pickupLocation: $request->pickupLocation(),
            returnLocation: $request->returnLocation(),
            extras: $request->extraSelections(),
            customerNotes: $request->validated('customer_notes'),
        );

        return (new ReservationDetailResource($reservation->load(ReservationDetailResource::RELATIONS)))
            ->additional(['message' => __('api.booking.created')])
            ->response()
            ->setStatusCode(201);
    }
}
