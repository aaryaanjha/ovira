const redirects = [
  { source: "/index.html", destination: "/", permanent: true },
  { source: "/article.html", destination: "/article", permanent: true },
  ...["appointment", "blogs", "myths", "privacy", "terms"].map(page => ({
    source: "/" + page + ".html", destination: "/" + page, permanent: true,
  })),
];

const production = process.env.NODE_ENV === "production";

export default {
  poweredByHeader: false,
  serverExternalPackages: ["postgres"],
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  async redirects() { return redirects; },
  async headers() {
    // Everything the site loads is first-party except admin-uploaded images, which redirect to
    // Supabase Storage. Next.js still needs inline scripts and styles, so those stay allowed.
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (production ? "" : " 'unsafe-eval'"),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      ...(production ? ["upgrade-insecure-requests"] : []),
    ].join("; ");
    const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          // Preview deployments duplicate the live site; keep them out of search results.
          ...(process.env.VERCEL_ENV === "preview" ? [noindex] : []),
        ],
      },
      { source: "/admin/:path*", headers: [noindex, { key: "Cache-Control", value: "no-store" }] },
      { source: "/admin", headers: [noindex, { key: "Cache-Control", value: "no-store" }] },
      { source: "/api/:path*", headers: [noindex] },
    ];
  },
};
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

