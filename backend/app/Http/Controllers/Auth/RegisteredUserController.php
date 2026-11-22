<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RegisteredUserController extends Controller
{
    /**
     * POST /api/auth/register: create a client account, log it in and send the
     * verification email.
     */
    public function store(RegisterRequest $request): JsonResponse
    {
        // Only these fields are copied: "role" and "is_active" keep their defaults (client, active).
        $user = User::create($request->safe()->only(['name', 'email', 'phone', 'password']));

        // Laravel's listener for this event sends the verification email (User::sendEmailVerificationNotification).
        event(new Registered($user));

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return (new UserResource($user))
            ->additional(['message' => __('api.auth.registered')])
            ->response()
            ->setStatusCode(201);
    }
}
