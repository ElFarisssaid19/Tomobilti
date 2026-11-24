<?php

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A customer account in the back office: profile, account state, and (when loaded)
 * the number of reservations and the total spent on completed rentals (a
 * withSum('reservations', 'total') constrained to completed reservations).
 * The password hash and the remember token are never exposed.
 *
 * @mixin User
 */
class AdminClientResource extends JsonResource
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
            'is_verified' => $this->email_verified_at !== null,
            'is_active' => $this->is_active,
            'phone' => $this->phone,
            'city' => $this->city,
            'address' => $this->address,
            'birth_date' => $this->birth_date?->toDateString(),
            'age' => $this->age,
            'cin' => $this->cin,
            'driving_license_number' => $this->driving_license_number,
            'driving_license_issued_at' => $this->driving_license_issued_at?->toDateString(),
            'has_valid_license' => $this->hasValidLicense(),
            'has_complete_profile' => $this->hasCompleteProfile(),
            'reservations_count' => $this->whenCounted('reservations'),
            'total_spent' => $this->when(
                array_key_exists('reservations_sum_total', $this->resource->getAttributes()),
                fn (): string => bcadd((string) ($this->reservations_sum_total ?? '0'), '0', 2),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
