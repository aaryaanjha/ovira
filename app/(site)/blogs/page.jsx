import JsonLd from "../../../components/JsonLd";
import Journal from "../../../components/Journal";
import { PopularGuides } from "../../../components/PublicContent";
import { publicArticles } from "../../../lib/store.mjs";
import { breadcrumbSchema, pageMetadata, siteUrl } from "../../../lib/seo.mjs";

export const metadata = pageMetadata({
  title: "Fertility and IVF Articles: Guides and Advice",
  description: "Read OVIRA’s fertility and IVF guides: what IVF is, the IVF process step by step, IVF vs IUI, PCOS and fertility, ovulation, and emotional wellbeing.",
  path: "/blogs",
  keywords: ["fertility articles", "IVF articles", "IVF guide", "fertility blog", "IVF process", "IVF vs IUI", "PCOS and fertility", "ovulation"],
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
    <main><JsonLd data={breadcrumbSchema("Fertility Articles", "/blogs")} />{articles.length > 0 && <JsonLd data={collectionSchema} />}<section className="page-hero wrap"><p className="eyebrow">The OVIRA blogs</p><h1>Fertility and IVF articles<br />for your <em>journey.</em></h1><p>Clear, compassionate guides to IVF and IUI treatment, PCOS and fertility, ovulation, your first fertility consultation and emotional wellbeing. Every article is general information to help you prepare questions for a qualified fertility specialist.</p></section><div className="wrap blogs-guides"><PopularGuides articles={articles} heading="Start with these guides" /></div><Journal articles={articles} /></main>
  );
}
