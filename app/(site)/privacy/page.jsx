import { publicContact } from "../../../lib/store.mjs";

export const metadata = { title: "Privacy Policy", description: "How OVIRA handles appointment information." };

export default async function Page() {
  const { email } = await publicContact();
  return (
    <main className="wrap legal-page"><p className="eyebrow">OVIRA</p><h1>Privacy Policy</h1><p className="legal-updated">Last updated: 12 November 2026</p><h2>Information you share</h2><p>When you send an appointment request, we use the details you provide to respond and coordinate follow-up. Please avoid including sensitive medical information in the initial form.</p><h2>How we handle information</h2><p>We do not sell your personal information. We use reasonable safeguards and limit access to people who need the information to respond to you.</p><h2>Your choices</h2><p>You may contact us to ask about the information you shared or request that we remove it, subject to applicable requirements. Email <a href={"mailto:" + email}>{email}</a>.</p></main>
  );
}
