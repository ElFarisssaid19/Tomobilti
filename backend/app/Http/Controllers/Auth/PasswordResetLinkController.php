<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

class PasswordResetLinkController extends Controller
{
    /**
     * POST /api/auth/forgot-password: email a reset link (FRONTEND_URL/reinitialiser-mot-de-passe).
     *
     * The answer is the same whether or not an account exists for this email,
     * so the form cannot be used to find out who is a customer.
     */
    public function store(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        return response()->json(['message' => __('api.auth.reset_link_sent')]);
    }
}
