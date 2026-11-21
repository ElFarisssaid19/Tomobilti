<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Carbon\CarbonInterface;
use Database\Factories\UserFactory;
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
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Minimum number of years a customer must have held a driving licence.
     */
    public const MIN_LICENSE_YEARS = 2;

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
}
