import Journal from "../../../components/Journal";
import { publicArticles } from "../../../lib/store.mjs";
import { pageMetadata } from "../../../lib/seo.mjs";

export const metadata = pageMetadata({
  title: "Fertility and IVF Articles",
  description: "Explore clear, compassionate articles about fertility, IVF treatment, and reproductive health from OVIRA.",
  path: "/blogs",
  keywords: ["fertility articles", "IVF guides", "reproductive health", "fertility treatment information"],
});

export default async function Page() {
  const articles = await publicArticles();
  return (
    <main><section className="page-hero wrap"><p className="eyebrow">The OVIRA blogs</p><h1>Fertility and IVF articles<br />for your <em>journey.</em></h1><p>Clear, compassionate reading to help you feel more informed and less alone.</p></section><Journal articles={articles} /></main>
  );
}
