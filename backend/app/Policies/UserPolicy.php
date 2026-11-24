<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Customer accounts in the back office (Clients). Staff accounts are not managed
 * here: they are not listed, their page answers 404, and nobody can deactivate an
 * admin (themselves included) from this screen.
 */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, User $client): Response
    {
        if (! $user->isAdmin()) {
            return Response::deny();
        }

        return $client->isClient() ? Response::allow() : Response::denyAsNotFound();
    }

    public function activate(User $user, User $client): Response
    {
        if (! $user->isAdmin()) {
            return Response::deny();
        }

        return $client->isClient()
            ? Response::allow()
            : Response::deny(__('api.admin.clients.not_a_client'));
    }

    /**
     * Deactivating signs the customer out everywhere (see ClientActivationController).
     */
    public function deactivate(User $user, User $client): Response
    {
        if (! $user->isAdmin()) {
            return Response::deny();
        }

        if ($user->is($client)) {
            return Response::deny(__('api.admin.clients.cannot_deactivate_self'));
        }

        return $client->isAdmin()
            ? Response::deny(__('api.admin.clients.cannot_deactivate_admin'))
            : Response::allow();
    }
}
