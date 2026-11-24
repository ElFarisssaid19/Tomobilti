<?php

namespace App\Policies;

use App\Models\User;

/**
 * The fleet (Voitures): admins only. Removing a car is a soft delete, refused by the
 * controller while upcoming reservations still need it.
 */
class CarPolicy extends AdminPolicy
{
    public function restore(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Available, in maintenance or out of service.
     */
    public function changeStatus(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Upload, reorder, describe and delete photos.
     */
    public function manageImages(User $user): bool
    {
        return $user->isAdmin();
    }
}
