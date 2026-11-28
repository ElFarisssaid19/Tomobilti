/**
 * Content-Security-Policy of the built SPA (docs/security.md). `vite preview` sends it,
 * so the production build is tested with it; the production web server sends the same
 * header (with `upgrade-insecure-requests` on HTTPS).
 *
 * - Scripts: only the app's own files (no inline script, no eval).
 * - Styles: the app's CSS plus 'unsafe-inline', because Motion (popLayout) and sonner
 *   insert <style> elements at runtime.
 * - The API origin serves the JSON and the car photos (/storage).
 */
export default function contentSecurityPolicy(apiUrl) {
  const api = new URL(apiUrl).origin
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${api}`,
    "font-src 'self'",
    `connect-src 'self' ${api}`,
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}
