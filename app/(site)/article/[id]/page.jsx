import { cache } from "react";
import { notFound } from "next/navigation";
import JsonLd from "../../../../components/JsonLd";
import { ArticleView } from "../../../../components/PublicContent";
import { publicArticles } from "../../../../lib/store.mjs";
import { fullTitle, pageMetadata, shortDescription, siteUrl } from "../../../../lib/seo.mjs";

const loadArticles = cache(publicArticles);

// Pre-build the published articles; new ones are built on first visit and then cached.
export async function generateStaticParams() {
  return (await loadArticles()).map(article => ({ id: article.slug || article.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = (await loadArticles()).find(item => item.id === id || item.slug === id);
  if (!article) return {};
  const slug = article.slug || article.id;
  const title = fullTitle(article.seoTitle || article.title);
  const description = shortDescription(article.metaDescription || article.description);
  const url = "/article/" + encodeURIComponent(slug);
  const image = article.featuredImage || "/assets/ovira-share.jpg";
  return {
    ...pageMetadata({
      title: article.seoTitle || article.title,
      description,
      path: url,
      keywords: article.keywords,
    }),
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt || article.publishedAt || undefined,
      authors: [article.author || "OVIRA"],
      tags: [article.category, ...article.keywords.slice(0, 4)],
      images: [{ url: image, alt: article.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function Article({ params }) {
  const { id } = await params;
  const articles = await loadArticles();
  const index = articles.findIndex(item => item.id === id || item.slug === id);
  if (index === -1) notFound();
  const article = articles[index];
  const slug = article.slug || article.id;
  const url = siteUrl("/article/" + encodeURIComponent(slug));
  const organizationId = siteUrl("/#organization");
  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": url + "#article",
        // Google truncates headlines over 110 characters in Article results.
        headline: article.title.length > 110 ? article.title.slice(0, 109).trimEnd() + "…" : article.title,
        description: shortDescription(article.metaDescription || article.description),
        // The page's sharing image is used when the article has no featured image of its own.
        image: [siteUrl(article.featuredImage || "/assets/ovira-share.jpg")],
        datePublished: article.publishedAt || undefined,
        dateModified: article.updatedAt || article.publishedAt || undefined,
        author: { "@type": "Organization", "@id": organizationId, name: "OVIRA", url: siteUrl("/about") },
        publisher: { "@id": organizationId },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        inLanguage: "en-IN",
        articleSection: article.category || undefined,
        keywords: article.keywords.join(", "),
        wordCount: [article.intro, ...article.sections.flat()].join(" ").trim().split(/\s+/).length,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Fertility Articles", item: siteUrl("/blogs") },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
    ],
  };
  // In-body links to related guides (only published ones, so they can never be broken links).
  const bySlug = new Map(articles.map(item => [item.slug || item.id, item]));
  const guides = article.relatedIds.map(slug => bySlug.get(slug)).filter(item => item && item.id !== article.id);
  const related = articles
    .filter(item => item.id !== article.id)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 3);
  return <><JsonLd data={articleSchema} /><ArticleView article={article} related={related} guides={guides} index={index} /></>;
}
