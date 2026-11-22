<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Notifications\Auth\ResetPasswordNotification;
use App\Notifications\Auth\VerifyEmailNotification;
use Carbon\CarbonInterface;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * An account: agency staff (admin) or customer (client).
 *
 * "role" and "is_active" are deliberately not mass assignable, so a registration
 * or profile form can never promote a user to admin or reactivate an account.
 *
 * Customers must verify their email address (MustVerifyEmail). The verification
 * and password reset emails link to the React SPA (see app/Notifications/Auth).
 */
#[Fillable([
    'name',
    'email',
    'password',
    'phone',
    'city',
    'address',
    'birth_date',
    'cin',
    'driving_license_number',
    'driving_license_issued_at',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Minimum number of years a customer must have held a driving licence.
     */
    public const MIN_LICENSE_YEARS = 2;

    /**
     * Minimum age to create a customer profile (and to hold a driving licence).
     */
    public const MIN_AGE = 18;

    /**
     * Profile fields a customer must fill in before booking a car.
     *
     * @var list<string>
     */
    public const BOOKING_PROFILE_FIELDS = [
        'phone',
        'birth_date',
        'cin',
        'driving_license_number',
        'driving_license_issued_at',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => 'client',
        'is_active' => true,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'birth_date' => 'date',
            'driving_license_issued_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Reservations made by this user.
     *
     * @return HasMany<Reservation, $this>
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isClient(): bool
    {
        return $this->role === UserRole::Client;
    }

    /**
     * Age in full years, or null when the birth date is unknown.
     *
     * @return Attribute<int|null, never>
     */
    protected function age(): Attribute
    {
        return Attribute::make(
            get: fn (): ?int => $this->birth_date ? (int) $this->birth_date->diffInYears(now()) : null,
        );
    }

    /**
     * Whether the user has held a driving licence for at least MIN_LICENSE_YEARS
     * on the given date (today by default, or the pick-up date of a booking).
     */
    public function hasValidLicense(?CarbonInterface $on = null): bool
    {
        if ($this->driving_license_issued_at === null) {
            return false;
        }

        $on ??= now();

        return $this->driving_license_issued_at->lessThanOrEqualTo(
            $on->copy()->subYears(self::MIN_LICENSE_YEARS),
        );
    }

    /**
     * Whether every field required to book a car is filled in.
     */
    public function hasCompleteProfile(): bool
    {
        foreach (self::BOOKING_PROFILE_FIELDS as $field) {
            if (blank($this->{$field})) {
                return false;
            }
        }

        return true;
    }

    /**
     * Send the French verification email that links to the SPA.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    /**
     * Send the French password reset email that links to the SPA.
     *
     * @param  string  $token
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
