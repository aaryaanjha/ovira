import { publicContact } from "../../../lib/store.mjs";
import { pageMetadata } from "../../../lib/seo.mjs";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "Read how OVIRA handles the contact details you share through appointment requests and how to ask about your information.",
  path: "/privacy",
});

export default async function Page() {
  const { email } = await publicContact();
  return (
    <main className="wrap legal-page"><p className="eyebrow">OVIRA</p><h1>Privacy Policy</h1><p className="legal-updated">Last updated: 19 November 2026</p><h2>Information you share</h2><p>When you send an appointment or contact request, we collect the details you enter, such as your name, phone number, email address, city or area, contact preference, preferred appointment time, and message. The form asks for consent to use these details to respond. Please do not include medical records or sensitive health information in an initial enquiry.</p><h2>How we use and store information</h2><p>We use enquiry details to respond, coordinate follow-up, and manage appointment requests. Depending on the storage configuration, requests are stored in the website database or in a restricted Google Sheets workspace used by the site. Access is limited to people who need the information to respond. We do not sell enquiry information or use it for unrelated marketing.</p><h2>Retention and your choices</h2><p>The website does not automatically delete enquiry records. You may contact us to ask about the information you shared or request its correction or deletion. We will review requests subject to applicable requirements. Email <a href={"mailto:" + email}>{email}</a>.</p><h2>Third-party services</h2><p>Website hosting and configured storage providers process information on behalf of the site. Their systems may handle data under their own privacy and security terms. Contact us if you need more information about the providers currently used.</p></main>
  );
}
