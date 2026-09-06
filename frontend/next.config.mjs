/** @type {import('next').NextConfig} */

// ── Content Security Policy ──────────────────────────────────────────────
// Helmet sets security headers on the Express app, but Caddy only routes
// /api/* there — every HTML page comes from Next.js and was being served with
// no CSP, HSTS, frame protection or nosniff at all.
//
// This is a STATIC policy in next.config rather than the nonce-based one from
// Next's CSP guide, and that is a deliberate trade-off. Nonces have to be
// generated per request in proxy.js, which forces every page into dynamic
// rendering — the exact thing that currently defeats the `revalidate = 60`
// settings across the app and keeps `Cache-Control: no-store` on every
// response. Restoring static rendering is the largest SEO win available, so
// the policy must not depend on per-request nonces.
//
// The cost is 'unsafe-inline' in script-src: Next.js inlines hydration and
// bootstrap scripts, and without a nonce there is no way to allow exactly
// those. So this policy does NOT stop an injected inline script. What it does
// stop is the rest of the chain — loading attacker-hosted scripts, and
// exfiltrating anything, since connect-src is restricted to our own origin and
// the two identity providers. The stored-XSS hole this defends against is
// already closed at its source by serializeJsonLd() in lib/seo.js; this is a
// second layer, not the fix.
//
// Shipped as Content-Security-Policy-Report-Only first: violations are logged
// to the browser console without blocking anything, so the Google and Facebook
// sign-in flows can be exercised for real before it is enforced. Rename the
// header key to "Content-Security-Policy" to switch it on.

const CSP_DIRECTIVES = [
  "default-src 'self'",

  // 'unsafe-inline' covers Next.js's own inline bootstrap/hydration scripts.
  // accounts.google.com serves the Google Identity Services client used by
  // @react-oauth/google; connect.facebook.net serves the Facebook SDK loaded
  // in components/auth/FacebookLoginButton.jsx.
  "script-src 'self' 'unsafe-inline' https://accounts.google.com https://connect.facebook.net",

  // Tailwind and Next both emit inline <style> blocks.
  "style-src 'self' 'unsafe-inline'",

  // next/image serves optimized uploads from our own origin, but avatars and a
  // few listing images are rendered with a plain <img src>, so the upload hosts
  // have to be named. lh3.googleusercontent.com and platform-lookaside.fbsbx.com
  // are the profile pictures that Google and Facebook sign-in return.
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://lh3.googleusercontent.com https://platform-lookaside.fbsbx.com",

  "font-src 'self' data:",

  // The browser calls the API same-origin (https://heavywheelspk.com/api via
  // Caddy), so 'self' covers it. The identity providers need their own token
  // and profile endpoints.
  "connect-src 'self' https://accounts.google.com https://graph.facebook.com https://connect.facebook.net",

  // Both sign-in flows render inside a provider-hosted iframe.
  "frame-src https://accounts.google.com https://www.facebook.com https://staticxx.facebook.com",

  // Nothing legitimately embeds this site, so refuse to be framed at all.
  "frame-ancestors 'none'",

  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  // Report-only for now — see the note above before switching this on.
  { key: "Content-Security-Policy-Report-Only", value: CSP_DIRECTIVES },

  // Matches the max-age helmet already sends on /api/*, so the whole origin
  // agrees rather than the two halves disagreeing.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },

  { key: "X-Content-Type-Options", value: "nosniff" },

  // Legacy companion to frame-ancestors, for browsers that predate CSP3.
  { key: "X-Frame-Options", value: "DENY" },

  // Sends the full URL same-origin and only the origin cross-site. Helmet uses
  // no-referrer on the API, but that also strips the referrer from outbound
  // links, which would hide HeavyWheels as a traffic source from any site a
  // seller links to.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // The listing search box offers voice input via the Web Speech API
  // (lib/useSpeechToText.js), so microphone stays allowed for our own origin.
  // Nothing in the app uses the camera, geolocation or payment request.
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), payment=(), usb=(), microphone=(self)",
  },
];

const nextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  // Next advertises itself in X-Powered-By by default; there is no reason to
  // tell every visitor which framework and stack to target.
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Every route Next.js serves. /api/* never reaches here — Caddy sends
        // that straight to Express, where helmet still owns the headers.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  images: {
    // Hosts that next/image is allowed to optimize. Uploads are served from
    // Cloudinary; the static fallback image comes from Unsplash.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
    ],
  },
};

export default nextConfig;
