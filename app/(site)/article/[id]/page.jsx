import { cache } from "react";
import { notFound } from "next/navigation";
import JsonLd from "../../../../components/JsonLd";
import { ArticleView } from "../../../../components/PublicContent";
import { publicArticles } from "../../../../lib/store.mjs";
import { pageMetadata, siteUrl } from "../../../../lib/seo.mjs";

const loadArticles = cache(publicArticles);

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = (await loadArticles()).find(item => item.id === id || item.slug === id);
  if (!article) return {};
  const slug = article.slug || article.id;
  const title = article.seoTitle || article.title;
  const description = article.metaDescription || article.description;
  const url = "/article/" + encodeURIComponent(slug);
  const image = article.featuredImage || "/assets/ovira-share.jpg";
  return {
    ...pageMetadata({
      title,
      description,
      path: url,
    }),
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt || article.publishedAt || undefined,
      authors: [article.author || "OVIRA"],
      tags: [article.category, "Fertility care"],
      images: [{ url: image, alt: article.title }],
    },
    twitter: { card: "summary_large_image", title: title + " | OVIRA", description, images: [image] },
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
        headline: article.title,
        description: article.metaDescription || article.description,
        image: article.featuredImage ? [siteUrl(article.featuredImage)] : undefined,
        datePublished: article.publishedAt || undefined,
        dateModified: article.updatedAt || article.publishedAt || undefined,
        author: { "@type": "Organization", "@id": organizationId, name: "OVIRA", url: siteUrl("/about") },
        publisher: { "@id": organizationId },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        inLanguage: "en-IN",
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
  const related = articles
    .filter(item => item.id !== article.id)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 3);
  return <><JsonLd data={articleSchema} /><ArticleView article={article} related={related} index={index} /></>;
}
