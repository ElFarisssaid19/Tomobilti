<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class ApiErrorResponsesTest extends TestCase
{
    public function test_unknown_api_route_returns_json_404_even_without_accept_header(): void
    {
        $response = $this->get('/api/does-not-exist');

        $response
            ->assertNotFound()
            ->assertHeader('Content-Type', 'application/json')
            ->assertExactJson(['message' => 'Ressource introuvable.']);
    }

    public function test_unauthenticated_request_returns_json_401(): void
    {
        $this->get('/api/user')
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Vous devez être connecté pour accéder à cette ressource.']);
    }

    public function test_forbidden_request_returns_json_403(): void
    {
        Route::middleware('api')->get('/api/_test/forbidden', fn () => abort(403));

        $this->get('/api/_test/forbidden')
            ->assertForbidden()
            ->assertExactJson(['message' => "Vous n'êtes pas autorisé à effectuer cette action."]);
    }

    public function test_validation_errors_are_returned_in_french(): void
    {
        Route::middleware('api')->post('/api/_test/validation', function (Request $request) {
            $request->validate(['email' => ['required', 'email']]);
        });

        $this->post('/api/_test/validation')
            ->assertUnprocessable()
            ->assertExactJson([
                'message' => 'Le champ adresse e-mail est obligatoire.',
                'errors' => [
                    'email' => ['Le champ adresse e-mail est obligatoire.'],
                ],
            ]);
    }

    public function test_server_errors_return_json_500_without_debug_details_in_production(): void
    {
        config(['app.debug' => false]);
        Route::middleware('api')->get('/api/_test/crash', fn () => throw new RuntimeException('boom'));

        $this->get('/api/_test/crash')
            ->assertStatus(500)
            ->assertExactJson(['message' => 'Erreur interne du serveur.']);
    }
}
