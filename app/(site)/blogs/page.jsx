import Journal from "../../../components/Journal";
import { publicArticles } from "../../../lib/store.mjs";

export const metadata = { title: "OVIRA Journal", description: "Fertility insights and guidance from OVIRA." };

export default async function Page() {
  const articles = await publicArticles();
  return (
    <main><section className="page-hero wrap"><p className="eyebrow">The OVIRA journal</p><h1>Thoughtful notes<br />for your <em>journey.</em></h1><p>Clear, compassionate reading to help you feel more informed and less alone.</p></section><Journal articles={articles} /></main>
  );
}
