import AppointmentForm from "../../../components/AppointmentForm";
import { ContactLines } from "../../../components/PublicContent";
import { hasPersistentDatabase, publicContact } from "../../../lib/store.mjs";
import { pageMetadata } from "../../../lib/seo.mjs";

export const metadata = pageMetadata({
  title: "Contact OVIRA Fertility Care",
  description: "Contact OVIRA with questions or request a fertility care appointment. Our team can help you understand possible next steps.",
  path: "/appointment",
  keywords: ["contact OVIRA", "fertility care appointment", "fertility consultation"],
});

export default async function Page() {
  const contact = await publicContact();
  const formAvailable = hasPersistentDatabase();
  return (
    <main>
      <section className="page-hero wrap">
        <p className="eyebrow">A thoughtful first step</p>
        <h1>Start your fertility care<br /><em>conversation.</em></h1>
        <p>Share a few details and our care team will reach out to help you find the right next step.</p>
      </section>
      <section className="contact-section">
        <div className="wrap appointment-layout">
          <AppointmentForm available={formAvailable} contact={contact} />
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
    </main>
  );
}
