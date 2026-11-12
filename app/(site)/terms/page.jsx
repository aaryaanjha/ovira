import { publicContact } from "../../../lib/store.mjs";

export const metadata = { title: "Terms & Conditions", description: "Terms and conditions for using the OVIRA website." };

export default async function Page() {
  const { email } = await publicContact();
  return (
    <main className="wrap legal-page"><p className="eyebrow">OVIRA</p><h1>Terms &amp; Conditions</h1><p className="legal-updated">Last updated: 12 November 2026</p><h2>Using this website</h2><p>This website shares general information about fertility and OVIRA services. It is not a substitute for professional medical advice, diagnosis, or treatment. Please speak with a qualified clinician about your individual health.</p><h2>Appointment requests</h2><p>Submitting a request does not create a doctor-patient relationship or confirm an appointment. Our team will contact you to discuss availability and next steps.</p><h2>Contact</h2><p>For questions about these terms, contact <a href={"mailto:" + email}>{email}</a>.</p></main>
  );
}
