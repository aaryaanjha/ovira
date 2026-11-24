import { publicArticles } from "../lib/store.mjs";
import { siteUrl } from "../lib/seo.mjs";

export const revalidate = 600;

// lastModified should change only when a page's content really changes. Pages that list articles
// use the newest article date; legal pages use the "Last updated" date shown on the page.
const publicPages = [
  { path: "/", listsArticles: true, priority: 1, changeFrequency: "weekly" },
  { path: "/blogs", listsArticles: true, priority: 0.9, changeFrequency: "weekly" },
  { path: "/myths", priority: 0.8 },
  { path: "/about", priority: 0.6 },
  { path: "/appointment", priority: 0.7 },
  { path: "/privacy", lastModified: "2026-11-19", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", lastModified: "2026-11-24", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap() {
  const articles = await publicArticles();
  const newestArticle = articles.map(article => article.updatedAt || article.publishedAt).filter(Boolean).sort().at(-1);
  return [
    ...publicPages.map(page => ({
      url: siteUrl(page.path),
      lastModified: page.lastModified || (page.listsArticles ? newestArticle : undefined),
      changeFrequency: page.changeFrequency || "monthly",
      priority: page.priority,
    })),
    ...articles.map(article => ({
      url: siteUrl("/article/" + encodeURIComponent(article.slug || article.id)),
      lastModified: article.updatedAt || article.publishedAt || undefined,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  ];
}
