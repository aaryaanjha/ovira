import { publicArticles } from "../lib/store.mjs";
import { siteUrl } from "../lib/seo.mjs";

export const revalidate = 600;

const publicPages = ["/", "/about", "/blogs", "/myths", "/appointment", "/privacy", "/terms"];

export default async function sitemap() {
  const articles = await publicArticles();
  return [
    ...publicPages.map(path => ({
      url: siteUrl(path),
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.7,
    })),
    ...articles.map(article => ({
      url: siteUrl("/article/" + encodeURIComponent(article.slug || article.id)),
      lastModified: article.updatedAt || article.publishedAt || undefined,
      changeFrequency: "monthly",
      priority: 0.6,
    })),
  ];
}
