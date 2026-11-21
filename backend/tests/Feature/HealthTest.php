<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_reports_ok_when_database_is_reachable(): void
    {
        $response = $this->getJson('/api/health');

        $response
            ->assertOk()
            ->assertJsonStructure(['status', 'app', 'time', 'database'])
            ->assertJson([
                'status' => 'ok',
                'app' => 'Tomobilti',
                'database' => 'ok',
            ]);
    }

    public function test_health_endpoint_reports_degraded_when_database_is_unreachable(): void
    {
        config([
            'database.connections.broken' => [
                'driver' => 'sqlite',
                'database' => '/nonexistent/path/database.sqlite',
            ],
            'database.default' => 'broken',
        ]);
        DB::purge('broken');

        $this->getJson('/api/health')
            ->assertStatus(503)
            ->assertJson(['status' => 'degraded', 'database' => 'unreachable']);
    }

    public function test_root_route_returns_app_name_and_version_as_json(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertExactJson([
                'app' => 'Tomobilti',
                'version' => config('app.version'),
            ]);
    }
}
