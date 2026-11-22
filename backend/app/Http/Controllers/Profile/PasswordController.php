<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use Illuminate\Http\JsonResponse;

class PasswordController extends Controller
{
    /**
     * PUT /api/profile/password: change the password (the current one is required).
     *
     * Sanctum's AuthenticateSession middleware stores the new password hash in
     * this session, so this device stays logged in while sessions opened with
     * the old password on other devices are logged out.
     */
    public function update(UpdatePasswordRequest $request): JsonResponse
    {
        $request->user()->update([
            'password' => $request->validated('password'),
        ]);

        return response()->json(['message' => __('api.profile.password_updated')]);
    }
}
