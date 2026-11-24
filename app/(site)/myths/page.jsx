import JsonLd from "../../../components/JsonLd";
import { MythList } from "../../../components/PublicContent";
import MythQuestionForm from "../../../components/MythQuestionForm";
import { publicArticles, publicMyths } from "../../../lib/store.mjs";
import { breadcrumbSchema, pageMetadata } from "../../../lib/seo.mjs";

export const metadata = pageMetadata({
  title: "IVF Myths and Facts: Common Fertility Questions",
  description: "Is IVF painful? Does IVF always mean twins? Clear, evidence-informed answers to common IVF and fertility myths, and what to ask a fertility specialist.",
  path: "/myths",
  keywords: ["IVF myths", "IVF myths and facts", "fertility myths", "is IVF painful", "IVF twins", "IVF success", "infertility myths"],
});

export default async function Page() {
  const [myths, articles] = await Promise.all([publicMyths(), publicArticles()]);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: myths.map(item => ({
      "@type": "Question",
      name: item.myth,
      acceptedAnswer: { "@type": "Answer", text: [item.fact, item.more].filter(Boolean).join(" ") },
    })),
  };
  return (
    <main><JsonLd data={breadcrumbSchema("IVF Myths & Facts", "/myths")} />{myths.length > 0 && <JsonLd data={faqSchema} />}<section className="page-hero wrap"><p className="eyebrow">IVF: Myths &amp; Facts</p><h1>IVF myths and facts,<br /><em>explained clearly.</em></h1><p>IVF is an advanced fertility treatment, but common misconceptions can create fear and confusion. Explore clear, thoughtful answers to questions people often ask.</p></section><section className="wrap myths-page"><div className="disclaimer-note"><span aria-hidden="true">✳</span><p>These general explanations are for education, not personal medical advice. Your care team can help you understand what applies to you.</p></div><h2 className="journal-list-heading">Common IVF myths and the facts</h2><MythList items={myths} articles={articles} /><MythQuestionForm /></section></main>
  );
}
