<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExtraResource;
use App\Models\Extra;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExtraController extends Controller
{
    /**
     * GET /api/extras: options that can be added to a rental (read-only for now).
     */
    public function index(): AnonymousResourceCollection
    {
        return ExtraResource::collection(Extra::query()->active()->orderBy('price')->orderBy('name')->get());
    }
}
