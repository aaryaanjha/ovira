import { MythList } from "../../../components/PublicContent";
import MythQuestionForm from "../../../components/MythQuestionForm";
import { publicMyths } from "../../../lib/store.mjs";

export const metadata = { title: "Myths & Facts", description: "Clear answers to common fertility questions." };

export default async function Page() {
  const myths = await publicMyths();
  return (
    <main><section className="page-hero wrap"><p className="eyebrow">IVF: Myths &amp; Facts</p><h1>Breaking the myths.<br /><em>Understanding the facts.</em></h1><p>IVF is an advanced fertility treatment, but common misconceptions can create fear and confusion. Explore clear, thoughtful answers to questions people often ask.</p></section><section className="wrap myths-page"><div className="disclaimer-note"><span aria-hidden="true">✳</span><p>These general explanations are for education, not personal medical advice. Your care team can help you understand what applies to you.</p></div><MythList items={myths} /><MythQuestionForm /></section></main>
  );
}
