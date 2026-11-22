<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Login form: validates the input, then checks the credentials with brute-force
 * protection (5 failed attempts per minute for one email + IP address).
 */
class LoginRequest extends FormRequest
{
    public const MAX_ATTEMPTS = 5;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Log the user in, or throw a French error:
     * - 429 after too many failed attempts (with the wait time),
     * - 422 for a wrong email or password (same message for both, so nobody can
     *   find out which emails have an account),
     * - 403 for a disabled account, only once the password is proven correct.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // The session guard ("web") is named explicitly: Sanctum's auth:sanctum
        // middleware switches the default guard to its own token guard.
        $guard = Auth::guard('web');

        if (! $guard->validate($this->only('email', 'password'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        /** @var User $user */
        $user = $guard->getLastAttempted();

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => __('api.auth.inactive'),
            ])->status(403);
        }

        $guard->login($user, $this->boolean('remember'));

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * @throws ValidationException
     */
    private function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), self::MAX_ATTEMPTS)) {
            return;
        }

        event(new Lockout($this));

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => RateLimiter::availableIn($this->throttleKey()),
            ]),
        ])->status(429);
    }

    /**
     * One counter per email address and IP address.
     */
    private function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
