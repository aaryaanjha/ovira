// Health check shown to signed-in staff on the admin dashboard. Reports what is wrong and how
// to fix it, without exposing any secret values.
import { checkDatabase } from "./database.mjs";
import { checkStorage } from "./storage.mjs";
import { siteOrigin } from "./seo.mjs";

export async function setupStatus(requestHost = "") {
  const [database, storage] = await Promise.all([checkDatabase(), checkStorage()]);
  const siteHost = new URL(siteOrigin).host;
  const appOriginSet = Boolean((process.env.APP_ORIGIN || "").trim());
  const site = !appOriginSet && process.env.VERCEL === "1"
    ? { ok: false, title: "APP_ORIGIN is not set", fix: "Set APP_ORIGIN to your live address (for example https://www.ovirascience.com) so search engines index the right domain.", detail: "Using " + siteOrigin }
    : requestHost && requestHost !== siteHost && process.env.VERCEL_ENV === "production"
      ? { ok: false, title: "Search engines are pointed at " + siteHost, fix: "You are viewing " + requestHost + ". If " + siteHost + " is not connected to this Vercel project yet, connect it under Settings > Domains, or set APP_ORIGIN to the address you actually use.", detail: "" }
      : { ok: true, title: "Site address", fix: "", detail: siteOrigin };
  return [
    { key: "database", label: "Database", ...database },
    { key: "storage", label: "Image uploads", ...storage },
    { key: "site", label: "Site address (SEO)", ...site },
  ];
}
