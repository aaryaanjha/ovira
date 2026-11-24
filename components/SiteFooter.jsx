import { contactLinks } from "../lib/content.mjs";

export default function SiteFooter({ contact, socials = [] }) {
  const links = contactLinks(contact);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="brand" href="/">
              <span className="brand-mark"><img src="/assets/ovira-logo.png" alt="" width="40" height="40" /></span>
              <span className="brand-word">OVIRA<small>Life Begins Here</small></span>
            </a>
            <p>Fertility information, thoughtful science, and support for every journey.</p>
          </div>
          <div className="footer-column">
            <h3>Explore</h3>
            <a href="/">Home</a><a href="/myths">Myths &amp; Facts</a><a href="/blogs">Blogs</a>
            <a href="/about">About OVIRA</a>
          </div>
          <div className="footer-column">
            <h3>Get in touch</h3>
            <a href={links.phone}>{contact.phone}</a>
            <a href={links.whatsapp} target="_blank" rel="nofollow noopener noreferrer">WhatsApp us</a>
            <a href={links.email}>{contact.email}</a>
            {!!socials.length && <div className="footer-socials" aria-label="Social links">
              {socials.map(social => <a key={social.platform} href={social.url} target="_blank" rel="noreferrer">{social.platform}</a>)}
            </div>}
          </div>
          <div className="footer-column footer-company">
            <h3>Company address</h3>
            <p className="footer-company-name">{contact.companyName}</p>
            <address>{contact.address}</address>
            {contact.mapsUrl && <a href={contact.mapsUrl} target="_blank" rel="noreferrer">Open in Maps ↗</a>}
            <a href="/appointment">Contact us ↗</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 OVIRA. All rights reserved.</span>
          <span className="footer-legal"><a href="/terms">Terms &amp; Conditions</a><a href="/privacy">Privacy Policy</a></span>
        </div>
      </div>
    </footer>
  );
}
