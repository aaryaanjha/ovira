import JsonLd from "../../../components/JsonLd";
import { ContactLines, PopularGuides } from "../../../components/PublicContent";
import { breadcrumbSchema, pageMetadata } from "../../../lib/seo.mjs";
import { publicArticles, publicContact } from "../../../lib/store.mjs";

export const metadata = pageMetadata({
  title: "About OVIRA: Fertility and IVF Information",
  description: "Learn about OVIRA, our approach to clear fertility and IVF information, what this website does and does not offer, and our company and contact details.",
  path: "/about",
  keywords: ["about OVIRA", "OVIRA fertility", "fertility information", "IVF information", "Shree Shyam Srijan Services"],
});

export default async function AboutPage() {
  const [contact, articles] = await Promise.all([publicContact(), publicArticles()]);
  return (
    <main><JsonLd data={breadcrumbSchema("About OVIRA", "/about")} />
      <section className="page-hero wrap">
        <p className="eyebrow">About OVIRA</p>
        <h1>About OVIRA.<br /><em>Clear fertility &amp; IVF information.</em></h1>
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
            <h2>What this website offers</h2>
            <p>Plain-language guides to common fertility and IVF topics, including how IVF works, the stages of IVF treatment, the difference between IVF and IUI, PCOS and fertility, ovulation, and emotional wellbeing while trying to conceive. You can also contact our team by phone, WhatsApp, email or the enquiry form.</p>
          </article>
          <article className="about-page-card">
            <h2>What this website is not</h2>
            <p>OVIRA’s articles do not diagnose conditions, recommend a specific treatment, or promise pregnancy or success rates. Fertility depends on many individual factors, so decisions about tests and treatment belong in a conversation with a qualified fertility specialist who knows your history.</p>
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
        <PopularGuides articles={articles} heading="Fertility topics we cover" />
      </section>
    </main>
  );
}
