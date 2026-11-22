<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Send the next requests like the React SPA does: from FRONTEND_URL, so
     * Sanctum starts a session (cookie authentication) on the api routes.
     */
    protected function fromSpa(): static
    {
        return $this->withHeaders([
            'Origin' => config('app.frontend_url'),
            'Referer' => config('app.frontend_url').'/',
        ]);
    }
}
