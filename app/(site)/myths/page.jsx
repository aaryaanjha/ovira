import { MythList } from "../../../components/PublicContent";
import MythQuestionForm from "../../../components/MythQuestionForm";
import { hasPersistentDatabase, publicMyths } from "../../../lib/store.mjs";
import { pageMetadata } from "../../../lib/seo.mjs";

export const metadata = pageMetadata({
  title: "IVF Myths and Facts",
  description: "Get clear, evidence-informed answers to common IVF and fertility myths. Learn what to discuss with a qualified fertility clinician.",
  path: "/myths",
  keywords: ["IVF myths and facts", "fertility questions", "IVF treatment facts", "infertility information"],
});

export default async function Page() {
  const myths = await publicMyths();
  const formAvailable = hasPersistentDatabase();
  return (
    <main><section className="page-hero wrap"><p className="eyebrow">IVF: Myths &amp; Facts</p><h1>IVF myths and facts,<br /><em>explained clearly.</em></h1><p>IVF is an advanced fertility treatment, but common misconceptions can create fear and confusion. Explore clear, thoughtful answers to questions people often ask.</p></section><section className="wrap myths-page"><div className="disclaimer-note"><span aria-hidden="true">✳</span><p>These general explanations are for education, not personal medical advice. Your care team can help you understand what applies to you.</p></div><MythList items={myths} /><MythQuestionForm available={formAvailable} /></section></main>
  );
}
