<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_api_answer_carries_the_security_headers_errors_included(): void
    {
        foreach (['/api/categories', '/api/nothing-here', '/api/user'] as $uri) {
            $this->getJson($uri)
                ->assertHeader('X-Content-Type-Options', 'nosniff')
                ->assertHeader('X-Frame-Options', 'DENY')
                ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
                ->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
                ->assertHeader('Permissions-Policy')
                ->assertHeaderMissing('Strict-Transport-Security');
        }
    }

    public function test_https_adds_hsts_and_pdfs_keep_every_header_but_the_csp(): void
    {
        $user = User::factory()->create();
        $reservation = Reservation::factory()->for($user)->completed()->create();
        Invoice::factory()->for($reservation)->create();

        $this->actingAs($user)
            ->get("https://localhost/api/reservations/{$reservation->reference}/invoice")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
            ->assertHeaderMissing('Content-Security-Policy');
    }
}
