import JsonLd from "../../../components/JsonLd";
import { publicContact } from "../../../lib/store.mjs";
import { breadcrumbSchema, pageMetadata } from "../../../lib/seo.mjs";

export const metadata = pageMetadata({
  title: "Terms and Conditions for Using the OVIRA Website",
  description: "The terms for using the OVIRA website: why general fertility information is not medical advice, how appointment requests work, and how to contact us.",
  path: "/terms",
  keywords: ["OVIRA terms and conditions", "website terms", "medical disclaimer"],
});

export default async function Page() {
  const { email } = await publicContact();
  return (
    <main className="wrap legal-page"><JsonLd data={breadcrumbSchema("Terms & Conditions", "/terms")} /><p className="eyebrow">OVIRA</p><h1>Terms &amp; Conditions</h1><p className="legal-updated">Last updated: 24 November 2026</p><h2>Using this website</h2><p>This website shares general information about fertility and OVIRA services. It is not a substitute for professional medical advice, diagnosis, or treatment. Please speak with a qualified clinician about your individual health.</p><h2>Appointment requests</h2><p>Submitting a request does not create a doctor-patient relationship or confirm an appointment. Our team will contact you to discuss availability and next steps.</p><h2>Accuracy of information</h2><p>We aim to keep the information on this website clear and up to date, but medical understanding and individual circumstances change. Articles and Myths &amp; Facts entries are general explanations and may not reflect the latest guidance for your situation. Do not delay seeking professional advice because of something you read here.</p><h2>No guarantees</h2><p>Fertility outcomes depend on many individual factors. Nothing on this website is a promise of pregnancy, a particular treatment result, or a success rate.</p><h2>Links to other websites</h2><p>This website may link to other services, such as WhatsApp or map providers. We do not control those services and are not responsible for their content or privacy practices.</p><h2>Use of website content</h2><p>The text, design and images on this website belong to OVIRA or are used with permission. You may share links to our pages, but please do not copy or republish the content without permission.</p><h2>Changes to these terms</h2><p>We may update these terms from time to time. The date at the top of this page shows when they last changed.</p><h2>Contact</h2><p>For questions about these terms, contact <a href={"mailto:" + email}>{email}</a>.</p></main>
  );
}
