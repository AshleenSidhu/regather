import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Only talk to ourselves and our own Supabase project. No third-party scripts, fonts,
// analytics or trackers are loaded anywhere in the app.
function supabaseOrigins(): string[] {
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
    return [origin, origin.replace(/^http/, "ws")];
  } catch {
    return [];
  }
}
const supabase = supabaseOrigins();

const csp = [
  "default-src 'self'",
  // Next.js injects small inline scripts; dev mode also needs eval for React refresh.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase.filter((o) => o.startsWith("http")).join(" ")}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabase.join(" ")}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Signed-in pages read the session at request time by design, so skip the automatic
    // dev-only "instant navigation" warnings that flag every such route.
    instantInsights: { validationLevel: "manual-warning" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
