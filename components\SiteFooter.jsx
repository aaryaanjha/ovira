import { contactLinks } from "../lib/content.mjs";

export default function SiteFooter({ contact }) {
  const links = contactLinks(contact);
  return (
    <footer className="site-footer"><div className="wrap"><div className="footer-grid"><div className="footer-brand"><a className="brand" href="/"><span className="brand-mark"><img src="/assets/ovira-mark.webp" alt="" /></span><span className="brand-word">OVIRA<small>CARE WITH HEART</small></span></a><p>Compassionate fertility guidance, thoughtful science, and personal support for every journey.</p></div><div className="footer-column"><h3>Explore</h3><a href="/">Home</a><a href="/myths">Myths &amp; facts</a><a href="/blogs">Journal</a><a href="/#about">About OVIRA</a></div><div className="footer-column"><h3>Get in touch</h3><a href={links.phone}>{contact.phone}</a><a href={links.whatsapp} target="_blank" rel="noreferrer">WhatsApp us</a><a href={links.email}>{contact.email}</a></div><div className="footer-column"><h3>We’re here to help</h3><p style={{"fontSize": "10px", "color": "#bdcdc4", "maxWidth": "220px"}}>A first conversation can be simple. Reach out when you feel ready.</p><a href="/appointment">Book your appointment ↗</a></div></div><div className="footer-bottom"><span>© 2026 OVIRA Fertility Care. All rights reserved.</span><span className="footer-legal"><a href="/terms">Terms &amp; Conditions</a><a href="/privacy">Privacy Policy</a></span></div></div></footer>
  );
}
