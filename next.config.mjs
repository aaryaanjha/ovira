const redirects = [
  { source: "/index.html", destination: "/", permanent: true },
  { source: "/article.html", destination: "/article", permanent: true },
  ...["appointment", "blogs", "myths", "privacy", "terms"].map(page => ({
    source: "/" + page + ".html", destination: "/" + page, permanent: true,
  })),
];

export default {
  poweredByHeader: false,
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  async redirects() { return redirects; },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

