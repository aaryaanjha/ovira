import { MythList } from "../../../components/PublicContent";

export const metadata = { title: "Fertility myths & facts", description: "Clear answers to common fertility questions." };

export default function Page() {
  return (
    <main><section className="page-hero wrap"><p className="eyebrow">Clarity over confusion</p><h1>Let’s talk about<br /><em>what’s true.</em></h1><p>Fertility can come with a lot of noise. Here are thoughtful, evidence-informed starting points for your questions.</p></section><section className="wrap myths-page"><div className="disclaimer-note"><span>✳</span><p>These general explanations are for education, not personal medical advice. Your care team can help you understand what applies to you.</p></div><MythList /><div className="inline-cta"><p>Have a question of your own?</p><a className="button button-primary" href="/appointment">Talk with our team <span>↗</span></a></div></section></main>
  );
}
