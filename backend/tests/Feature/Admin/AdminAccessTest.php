<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_reaches_the_admin_area(): void
    {
        $admin = User::factory()->admin()->create(['name' => 'Karim Admin']);

        $this->actingAs($admin)
            ->getJson('/api/admin/ping')
            ->assertOk()
            ->assertJsonPath('message', 'Espace administrateur opérationnel. Bonjour, Karim Admin.');
    }

    public function test_client_gets_a_french_403(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/admin/ping')
            ->assertForbidden()
            ->assertExactJson(['message' => "Vous n'êtes pas autorisé à effectuer cette action."]);
    }

    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/admin/ping')->assertUnauthorized();
    }

    public function test_access_admin_gate_allows_admins_only(): void
    {
        $this->assertTrue(Gate::forUser(User::factory()->admin()->make())->allows('access-admin'));
        $this->assertFalse(Gate::forUser(User::factory()->make())->allows('access-admin'));
    }
}
