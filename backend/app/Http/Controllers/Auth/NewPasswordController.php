<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class NewPasswordController extends Controller
{
    /**
     * POST /api/auth/reset-password: set a new password with the token received by email.
     *
     * @throws ValidationException
     */
    public function store(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                // The "hashed" cast hashes the password; a new remember token logs out "remember me" devices.
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PasswordReset) {
            // An unknown email gets the "invalid link" message too: no hint about existing accounts.
            $error = $status === Password::InvalidUser ? Password::InvalidToken : $status;

            throw ValidationException::withMessages(['email' => __($error)]);
        }

        return response()->json(['message' => __($status)]);
    }
}
