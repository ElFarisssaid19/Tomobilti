<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;

class ProfileController extends Controller
{
    /**
     * PUT /api/profile: update the personal information, the driving licence and the ID.
     * A new email address must be verified again.
     */
    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $user->fill($request->validated());

        $emailChanged = $user->isDirty('email');

        if ($emailChanged) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return (new UserResource($user))->additional([
            'message' => $emailChanged ? __('api.profile.updated_verify_email') : __('api.profile.updated'),
        ]);
    }
}
