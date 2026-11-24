import AppointmentForm from "../../../components/AppointmentForm";
import JsonLd from "../../../components/JsonLd";
import { ContactLines } from "../../../components/PublicContent";
import { publicContact } from "../../../lib/store.mjs";
import { breadcrumbSchema, pageMetadata, siteUrl } from "../../../lib/seo.mjs";

export const metadata = pageMetadata({
  title: "Contact OVIRA: Fertility and IVF Enquiries",
  description: "Contact OVIRA by phone, WhatsApp, email or the enquiry form with fertility and IVF questions, and see what happens after you reach out to our team.",
  path: "/appointment",
  keywords: ["contact OVIRA", "fertility enquiry", "IVF enquiry", "fertility appointment", "IVF questions"],
});

export default async function Page() {
  const contact = await publicContact();
  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact OVIRA: Fertility and IVF Enquiries",
    url: siteUrl("/appointment"),
    mainEntity: { "@id": siteUrl("/#organization") },
  };
  return (
    <main><JsonLd data={breadcrumbSchema("Contact OVIRA", "/appointment")} /><JsonLd data={contactPageSchema} />
      <section className="page-hero wrap">
        <p className="eyebrow">A thoughtful first step</p>
        <h1>Contact OVIRA about<br /><em>fertility &amp; IVF care.</em></h1>
        <p>Share a few details and our care team will reach out to help you find the right next step.</p>
      </section>
      <section className="contact-section">
        <div className="wrap appointment-layout">
          <AppointmentForm />
          <aside className="appointment-aside">
            <p className="eyebrow">Contact information</p>
            <h2>{contact.companyName}</h2>
            <div className="company-address">
              <h3>Address</h3>
              <address>{contact.address}</address>
              {contact.mapsUrl && <a className="company-map" href={contact.mapsUrl} target="_blank" rel="noreferrer">Open in Maps ↗</a>}
            </div>
            <ContactLines contact={contact} />
            <p className="privacy-note">Your details are kept private and used only to respond to your request.</p>
          </aside>
        </div>
      </section>
      <section className="wrap appointment-expectations">
        <p className="eyebrow">A thoughtful first step</p>
        <h2>What happens after you reach out?</h2>
        <div className="appointment-expectations-grid">
          <article><h3>1. Choose how to connect</h3><p>Share your contact preference and, if helpful, a preferred date or time for a conversation.</p></article>
          <article><h3>2. We follow up</h3><p>Our team will use the details you provide to respond. Availability and timing are confirmed directly with you.</p></article>
          <article><h3>3. Decide on next steps</h3><p>A request is not a confirmed appointment or medical advice. You can ask questions before deciding what to do next.</p></article>
        </div>
        <p className="appointment-expectations-note">Please do not include medical records or sensitive health information in an initial enquiry.</p>
      </section>
    </main>
  );
}
