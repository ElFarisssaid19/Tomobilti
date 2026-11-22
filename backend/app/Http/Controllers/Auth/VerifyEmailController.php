<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class VerifyEmailController extends Controller
{
    /**
     * POST /api/auth/email/verify/{id}/{hash}?expires=...&signature=...
     *
     * Called by the SPA page /verifier-email with the parameters of the link
     * received by email. It works without being logged in (the link may be opened
     * on another device): the signature, made with the APP_KEY, proves that
     * Laravel generated this exact URL, and the hash must match the current email.
     */
    public function __invoke(Request $request, string $id, string $hash): JsonResponse
    {
        if (! URL::hasCorrectSignature($request)) {
            return $this->linkError('invalid');
        }

        if (! URL::signatureHasNotExpired($request)) {
            return $this->linkError('expired');
        }

        $user = User::find($id);

        if ($user === null || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return $this->linkError('invalid');
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'status' => 'already_verified',
                'message' => __('api.verification.already_verified'),
            ]);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return response()->json([
            'status' => 'verified',
            'message' => __('api.verification.verified'),
        ]);
    }

    /**
     * 403 with a "reason" the SPA uses to pick its screen (expired or invalid link).
     *
     * @param  'invalid'|'expired'  $reason
     */
    private function linkError(string $reason): JsonResponse
    {
        return response()->json([
            'status' => $reason,
            'message' => __("api.verification.{$reason}"),
        ], 403);
    }
}
