<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * POST /api/auth/email/verification-notification: send the verification email again.
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json([
                'status' => 'already_verified',
                'message' => __('api.verification.already_verified'),
            ]);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json([
            'status' => 'sent',
            'message' => __('api.verification.sent'),
        ]);
    }
}
