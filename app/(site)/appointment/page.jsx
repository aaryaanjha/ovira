import AppointmentForm from "../../../components/AppointmentForm";
import { ContactLines } from "../../../components/PublicContent";
import { publicContact } from "../../../lib/store.mjs";

export const metadata = { title: "Book an appointment", description: "Request a thoughtful fertility care appointment with OVIRA." };

export default async function Page() {
  const contact = await publicContact();
  return (
    <main><section className="page-hero wrap"><p className="eyebrow">A thoughtful first step</p><h1>Let’s start with<br /><em>a conversation.</em></h1><p>Share a few details and our care team will reach out to help you find the right next step.</p></section><section className="appointment-layout wrap"><div className="appointment-aside"><div className="aside-icon">✳</div><h2>You’re in<br />good hands.</h2><p>There’s no perfect way to begin. Tell us what feels comfortable, and we’ll take it from there.</p><ContactLines contact={contact} /><p className="privacy-note">Your details are kept private and used only to respond to your request.</p></div><AppointmentForm /></section></main>
  );
}
