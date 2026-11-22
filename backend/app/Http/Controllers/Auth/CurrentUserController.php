<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class CurrentUserController extends Controller
{
    /**
     * GET /api/user: the signed-in user (the SPA calls it on start-up).
     */
    public function __invoke(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
