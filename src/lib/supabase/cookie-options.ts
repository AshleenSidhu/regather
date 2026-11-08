// Shared by the proxy and server clients. Kept dependency-free so the proxy can import it.
// httpOnly: page scripts (and so any XSS) can never read the session refresh token.
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;
