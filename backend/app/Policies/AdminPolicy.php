<?php

namespace App\Policies;

use App\Models\User;

/**
 * Back-office resources that only agency staff manage (cars, categories, brands,
 * agencies, options). The admin routes already sit behind the "admin" middleware;
 * the policies repeat the rule next to each action, so it holds wherever the
 * action is called from.
 */
abstract class AdminPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Whether the user may delete; an item still in use is refused by the controller
     * with a 409 and a French message.
     */
    public function delete(User $user): bool
    {
        return $user->isAdmin();
    }
}
