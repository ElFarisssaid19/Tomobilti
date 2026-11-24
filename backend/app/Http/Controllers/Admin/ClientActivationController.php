<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminClientResource;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class ClientActivationController extends Controller
{
    /**
     * POST /api/admin/clients/{id}/activate: the customer can sign in and book again.
     */
    public function activate(User $client): AdminClientResource
    {
        Gate::authorize('activate', $client);

        $client->forceFill(['is_active' => true])->save();

        return (new AdminClientResource($client))->additional(['message' => __('api.admin.clients.activated')]);
    }

    /**
     * POST /api/admin/clients/{id}/deactivate: the account is disabled and signed out
     * everywhere (sessions, remember-me cookie, tokens), so the customer's next request
     * gets a 401 and they cannot sign in again (403 "compte désactivé"). An admin
     * cannot deactivate themselves or another admin (403 with the reason).
     */
    public function deactivate(User $client): AdminClientResource
    {
        Gate::authorize('deactivate', $client);

        $client->deactivateAndSignOut();

        return (new AdminClientResource($client))->additional(['message' => __('api.admin.clients.deactivated')]);
    }
}
