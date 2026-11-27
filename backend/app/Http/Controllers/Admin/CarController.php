<?php

namespace App\Http\Controllers\Admin;

use App\Filters\AdminCarFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CarIndexRequest;
use App\Http\Requests\Admin\CarRequest;
use App\Http\Resources\Admin\AdminCarResource;
use App\Http\Resources\Admin\AdminReservationResource;
use App\Models\Brand;
use App\Models\Car;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * The fleet in the back office. Cars are found by id (slugs change with the model or
 * the year), removed cars included: removing is a soft delete that keeps the history
 * of their reservations, and they can be restored.
 */
class CarController extends Controller
{
    /**
     * GET /api/admin/cars: search, filters, sort, 15 per page (AdminCarFilter).
     */
    public function index(CarIndexRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Car::class);

        $query = Car::query()->with(AdminCarResource::RELATIONS)->withCount('upcomingReservations');

        $cars = (new AdminCarFilter($request->validated()))
            ->apply($query)
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return AdminCarResource::collection($cars);
    }

    /**
     * POST /api/admin/cars: the slug comes from brand + model + year, kept unique.
     */
    public function store(CarRequest $request): JsonResponse
    {
        Gate::authorize('create', Car::class);

        $data = $request->validated();
        $data['slug'] = Car::uniqueSlug(Brand::findOrFail($data['brand_id'])->name, $data['model'], (int) $data['year']);

        $car = Car::create($data);

        return (new AdminCarResource($this->loadForPage($car)))
            ->additional(['message' => __('api.admin.cars.created')])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/admin/cars/{id}: every field, every photo.
     */
    public function show(Car $car): AdminCarResource
    {
        Gate::authorize('view', $car);

        return new AdminCarResource($this->loadForPage($car));
    }

    /**
     * PUT /api/admin/cars/{id}: a new brand, model or year gives a new slug.
     */
    public function update(CarRequest $request, Car $car): AdminCarResource
    {
        Gate::authorize('update', $car);

        $car->fill($request->validated());

        if ($car->isDirty(['brand_id', 'model', 'year'])) {
            $car->slug = Car::uniqueSlug(Brand::findOrFail($car->brand_id)->name, $car->model, $car->year, $car->id);
        }

        $car->save();

        return (new AdminCarResource($this->loadForPage($car)))
            ->additional(['message' => __('api.admin.cars.updated')]);
    }

    /**
     * DELETE /api/admin/cars/{id}: soft delete, refused (409) while upcoming or current
     * reservations still need the car; they are listed in the answer.
     *
     * The car row is locked first, like ReservationBooker does, so a booking made at the
     * same moment either lands before the check (and blocks the removal) or waits and
     * then finds the car removed.
     */
    public function destroy(Car $car): JsonResponse
    {
        Gate::authorize('delete', $car);

        return DB::transaction(function () use ($car): JsonResponse {
            Car::query()->whereKey($car->getKey())->lockForUpdate()->first();

            $upcoming = $car->upcomingReservations()
                ->with(AdminReservationResource::RELATIONS)
                ->orderBy('start_at')
                ->get();

            if ($upcoming->isNotEmpty()) {
                return response()->json([
                    'message' => trans_choice('api.admin.cars.delete_blocked', $upcoming->count(), [
                        'references' => $upcoming->take(3)->pluck('reference')->join(', ').($upcoming->count() > 3 ? '…' : ''),
                    ]),
                    'code' => 'car_has_reservations',
                    'reservations' => AdminReservationResource::collection($upcoming),
                ], 409);
            }

            $car->delete();

            return response()->json(['message' => __('api.admin.cars.deleted')]);
        });
    }

    /**
     * POST /api/admin/cars/{id}/restore
     */
    public function restore(Car $car): AdminCarResource
    {
        Gate::authorize('restore', $car);

        $car->restore();

        return (new AdminCarResource($this->loadForPage($car)))
            ->additional(['message' => __('api.admin.cars.restored')]);
    }

    private function loadForPage(Car $car): Car
    {
        return $car->load([...AdminCarResource::RELATIONS, 'images'])->loadCount('upcomingReservations');
    }
}
