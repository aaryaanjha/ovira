import JsonLd from "../../../components/JsonLd";
import Journal from "../../../components/Journal";
import { publicArticles } from "../../../lib/store.mjs";
import { breadcrumbSchema, pageMetadata, siteUrl } from "../../../lib/seo.mjs";

export const metadata = pageMetadata({
  title: "Fertility and IVF Articles",
  description: "Explore clear, compassionate articles about fertility, IVF treatment, and reproductive health from OVIRA.",
  path: "/blogs",
});

export default async function Page() {
  const articles = await publicArticles();
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Fertility and IVF Articles",
    url: siteUrl("/blogs"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: article.title,
        url: siteUrl("/article/" + encodeURIComponent(article.slug || article.id)),
      })),
    },
  };
  return (
    <main><JsonLd data={breadcrumbSchema("Fertility Articles", "/blogs")} /><JsonLd data={collectionSchema} /><section className="page-hero wrap"><p className="eyebrow">The OVIRA blogs</p><h1>Fertility and IVF articles<br />for your <em>journey.</em></h1><p>Clear, compassionate reading to help you feel more informed and less alone.</p></section><Journal articles={articles} /></main>
  );
}
