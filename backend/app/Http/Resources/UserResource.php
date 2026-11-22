<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The signed-in user as the SPA sees it. Lists every field explicitly, so the
 * password hash, the remember token and the is_active flag are never exposed.
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'phone' => $this->phone,
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'is_admin' => $this->isAdmin(),
            'city' => $this->city,
            'address' => $this->address,
            'birth_date' => $this->birth_date?->toDateString(),
            'cin' => $this->cin,
            'driving_license_number' => $this->driving_license_number,
            'driving_license_issued_at' => $this->driving_license_issued_at?->toDateString(),
            'has_complete_profile' => $this->hasCompleteProfile(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
