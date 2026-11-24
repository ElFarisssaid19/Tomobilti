<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route as RouteDefinition;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Every route under /api/admin, read from the router (so a new admin route is covered
 * as soon as it exists): guests get 401, clients get 403, before any model lookup.
 */
class AdminEndpointAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_admin_route_is_protected_by_sanctum_and_the_admin_middleware(): void
    {
        $routes = $this->adminRoutes();

        $this->assertGreaterThanOrEqual(40, count($routes));

        foreach ($routes as $route) {
            $middleware = $route->gatherMiddleware();
            $this->assertContains('auth:sanctum', $middleware, $route->uri());
            $this->assertContains('admin', $middleware, $route->uri());
        }
    }

    public function test_guests_get_401_on_every_admin_endpoint(): void
    {
        foreach ($this->adminRoutes() as $route) {
            foreach ($this->requests($route) as [$method, $uri]) {
                $this->json($method, $uri)->assertUnauthorized();
            }
        }
    }

    public function test_clients_get_403_on_every_admin_endpoint(): void
    {
        $client = User::factory()->create();

        foreach ($this->adminRoutes() as $route) {
            foreach ($this->requests($route) as [$method, $uri]) {
                $this->actingAs($client)
                    ->json($method, $uri)
                    ->assertForbidden()
                    ->assertJsonPath('message', "Vous n'êtes pas autorisé à effectuer cette action.");
            }
        }
    }

    /**
     * @return list<RouteDefinition>
     */
    private function adminRoutes(): array
    {
        return array_values(array_filter(
            Route::getRoutes()->getRoutes(),
            fn (RouteDefinition $route): bool => str_starts_with($route->uri(), 'api/admin'),
        ));
    }

    /**
     * One request per method of the route, with placeholder parameters (the role is
     * checked before route model binding, so they do not need to exist).
     *
     * @return list<array{0: string, 1: string}>
     */
    private function requests(RouteDefinition $route): array
    {
        $uri = '/'.preg_replace('/\{[^}]+\}/', '1', $route->uri());

        return array_map(
            fn (string $method): array => [$method, $uri],
            array_values(array_diff($route->methods(), ['HEAD'])),
        );
    }
}
