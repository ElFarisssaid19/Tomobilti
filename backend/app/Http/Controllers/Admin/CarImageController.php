<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CarImageReorderRequest;
use App\Http\Requests\Admin\CarImageUpdateRequest;
use App\Http\Requests\Admin\CarImageUploadRequest;
use App\Http\Resources\Admin\AdminCarImageResource;
use App\Models\Car;
use App\Models\CarImage;
use App\Services\CarPhotoUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * The image manager of a car. Every action answers with all the car's photos in
 * display order, so the SPA replaces its list in one go.
 */
class CarImageController extends Controller
{
    public function __construct(private CarPhotoUploader $uploader) {}

    /**
     * POST /api/admin/cars/{id}/images (multipart images[]): processed into 16:10 WebP
     * files of 1600 and 800 px, metadata stripped, credited "Tomobilti".
     */
    public function store(CarImageUploadRequest $request, Car $car): JsonResponse
    {
        Gate::authorize('manageImages', $car);

        $created = $this->uploader->upload($car, $request->file('images'));

        return $this->images($car, trans_choice('api.admin.cars.images_uploaded', $created->count()))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PATCH /api/admin/cars/{id}/images/{image} { alt?, is_primary? }
     */
    public function update(CarImageUpdateRequest $request, Car $car, CarImage $image): AnonymousResourceCollection
    {
        Gate::authorize('manageImages', $car);

        if ($request->has('alt')) {
            $image->update(['alt' => $request->validated('alt')]);
        }

        if ($request->boolean('is_primary')) {
            $this->uploader->makePrimary($image);
        }

        return $this->images($car, __('api.admin.cars.image_updated'));
    }

    /**
     * PUT /api/admin/cars/{id}/images/order { ids }: every photo of the car, once.
     */
    public function reorder(CarImageReorderRequest $request, Car $car): AnonymousResourceCollection
    {
        Gate::authorize('manageImages', $car);

        $ids = array_map('intval', $request->validated('ids'));
        $current = $car->images()->pluck('id')->all();

        if (count($ids) !== count($current) || array_diff($ids, $current) !== []) {
            throw ValidationException::withMessages(['ids' => __('api.admin.cars.reorder_mismatch')]);
        }

        $this->uploader->reorder($car, $ids);

        return $this->images($car, __('api.admin.cars.images_reordered'));
    }

    /**
     * DELETE /api/admin/cars/{id}/images/{image}: the files go too.
     */
    public function destroy(Car $car, CarImage $image): AnonymousResourceCollection
    {
        Gate::authorize('manageImages', $car);

        $this->uploader->delete($image);

        return $this->images($car, __('api.admin.cars.image_deleted'));
    }

    private function images(Car $car, string $message): AnonymousResourceCollection
    {
        return AdminCarImageResource::collection($car->images()->get())->additional(['message' => $message]);
    }
}
