<?php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * Renders every API error with the same JSON shape:
 *
 *   { "message": "...", "errors": { "field": ["..."] } }
 *
 * "errors" is only present for validation errors (422). When APP_DEBUG is
 * true, server errors also include a "debug" key to help during development.
 */
class ApiExceptionRenderer
{
    /**
     * English messages thrown by framework middleware, and their French key.
     *
     * @var array<string, string>
     */
    private const FRAMEWORK_MESSAGES = [
        'Your email address is not verified.' => 'api.booking.email_unverified',
    ];

    public static function shouldRender(Request $request): bool
    {
        return $request->is('api', 'api/*') || $request->expectsJson();
    }

    public function __invoke(Throwable $e, Request $request): ?Response
    {
        if (! static::shouldRender($request)) {
            return null;
        }

        // A ready-made response (e.g. a rate limiter with its own French message)
        // is sent as it is.
        if ($e instanceof HttpResponseException) {
            return $e->getResponse();
        }

        if ($e instanceof ValidationException) {
            return $this->respond($e->status, $e->getMessage(), $e->errors());
        }

        if ($e instanceof AuthenticationException) {
            return $this->respond(401, __('api.errors.401'));
        }

        if ($e instanceof TokenMismatchException) {
            return $this->respond(419, __('api.errors.419'));
        }

        if ($e instanceof HttpExceptionInterface && ($message = $this->explicitMessage($e)) !== null) {
            return $this->respond($e->getStatusCode(), $message, headers: $e->getHeaders());
        }

        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
            $key = "api.errors.{$status}";
            $message = __($key) !== $key ? __($key) : __('api.errors.default');

            return $this->respond($status, $message, headers: $e->getHeaders());
        }

        $debug = config('app.debug') ? [
            'exception' => $e::class,
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ] : null;

        return $this->respond(500, __('api.errors.500'), debug: $debug);
    }

    /**
     * A French message written for the user: the reason a policy gave
     * (Response::deny('…')), or a known framework message translated.
     */
    private function explicitMessage(Throwable $e): ?string
    {
        $previous = $e->getPrevious();

        if ($previous instanceof AuthorizationException && $previous->getMessage() !== 'This action is unauthorized.') {
            return $previous->getMessage();
        }

        $key = self::FRAMEWORK_MESSAGES[$e->getMessage()] ?? null;

        return $key ? __($key) : null;
    }

    /**
     * @param  array<string, array<int, string>>|null  $errors
     * @param  array<string, mixed>|null  $debug
     * @param  array<string, string>  $headers
     */
    private function respond(int $status, string $message, ?array $errors = null, ?array $debug = null, array $headers = []): JsonResponse
    {
        $body = ['message' => $message];

        if ($errors !== null) {
            $body['errors'] = $errors;
        }

        if ($debug !== null) {
            $body['debug'] = $debug;
        }

        return new JsonResponse($body, $status, $headers);
    }
}
