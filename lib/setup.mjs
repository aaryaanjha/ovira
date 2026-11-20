// Health check shown to signed-in staff on the admin dashboard. Reports what is wrong and how
// to fix it, without exposing any secret values.
import { checkDatabase } from "./database.mjs";
import { checkStorage } from "./storage.mjs";
import { siteOrigin } from "./seo.mjs";

// The production site is often opened through its *.vercel.app address while the real domain is
// connected too. Treat that as fine when the configured domain actually serves the site.
async function siteReachable() {
  try {
    const response = await fetch(new URL("/robots.txt", siteOrigin), { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(5000) });
    return response.ok && (await response.text()).includes("Sitemap:");
  } catch {
    return false;
  }
}

export async function setupStatus(requestHost = "") {
  const [database, storage, reachable] = await Promise.all([checkDatabase(), checkStorage(), siteReachable()]);
  const siteHost = new URL(siteOrigin).host;
  const appOriginSet = Boolean((process.env.APP_ORIGIN || "").trim());
  const site = !appOriginSet && process.env.VERCEL === "1"
    ? { ok: false, title: "APP_ORIGIN is not set", fix: "Set APP_ORIGIN to your live address (for example https://www.ovirascience.com) so search engines index the right domain.", detail: "Using " + siteOrigin }
    : reachable || !requestHost || requestHost === siteHost
      ? { ok: true, title: "Live at " + siteHost, fix: "", detail: requestHost && requestHost !== siteHost ? "You are on " + requestHost + "; search engines are pointed at " + siteHost + "." : "" }
      : { ok: false, title: siteHost + " is not serving this site", fix: "Connect " + siteHost + " under Vercel > Settings > Domains, or set APP_ORIGIN to the address you actually use.", detail: "You are viewing " + requestHost + "." };
  return [
    { key: "database", label: "Database", ...database },
    { key: "storage", label: "Image uploads", ...storage },
    { key: "site", label: "Site address (SEO)", ...site },
  ];
}
