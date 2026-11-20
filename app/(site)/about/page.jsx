import JsonLd from "../../../components/JsonLd";
import { ContactLines } from "../../../components/PublicContent";
import { breadcrumbSchema, pageMetadata } from "../../../lib/seo.mjs";
import { publicContact } from "../../../lib/store.mjs";

export const metadata = pageMetadata({
  title: "About OVIRA",
  description: "Learn about OVIRA, explore fertility and IVF information, and find the website’s published company and contact details.",
  path: "/about",
});

export default async function AboutPage() {
  const contact = await publicContact();
  return (
    <main><JsonLd data={breadcrumbSchema("About OVIRA", "/about")} />
      <section className="page-hero wrap">
        <p className="eyebrow">About OVIRA</p>
        <h1>Clear information.<br /><em>A more thoughtful first step.</em></h1>
        <p>OVIRA brings together general fertility information and a way to contact our team. Every person’s circumstances are different; use the information here to prepare questions for a qualified healthcare professional, not as a diagnosis or treatment plan.</p>
      </section>
      <section className="wrap about-page">
        <div className="about-page-grid">
          <article className="about-page-card">
            <h2>Explore the information</h2>
            <p>Browse our fertility and IVF articles, or visit Myths &amp; Facts for plain-language answers to common questions.</p>
            <p><a href="/blogs">Read fertility articles</a> · <a href="/myths">Explore Myths &amp; Facts</a></p>
          </article>
          <article className="about-page-card">
            <h2>Our approach</h2>
            <p>We aim to make the first conversation easier with clear information, respectful communication, and space for your questions. Treatment decisions should be made with a qualified clinician who understands your individual health.</p>
            <p><a href="/terms">Read the website terms</a> · <a href="/privacy">Read the privacy policy</a></p>
          </article>
          <article className="about-page-card">
            <h2>Company details</h2>
            <p>The website’s contact information lists {contact.companyName}.</p>
            <address>{contact.address}</address>
            {contact.mapsUrl && <p><a href={contact.mapsUrl} target="_blank" rel="noreferrer">Open the address in Maps ↗</a></p>}
          </article>
          <article className="about-page-card">
            <h2>Contact OVIRA</h2>
            <p>For questions about the website or to request a conversation, use the contact details below.</p>
            <ContactLines contact={contact} />
            <p><a href="/appointment">View appointment and contact options</a></p>
          </article>
        </div>
      </section>
    </main>
  );
}
