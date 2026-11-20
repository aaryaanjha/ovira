import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import JsonLd from "../../components/JsonLd";
import { publicContact, publicSocials } from "../../lib/store.mjs";
import { postalAddress, siteUrl } from "../../lib/seo.mjs";

// Public pages are served from cache and rebuilt in the background at most once a minute, so
// visitors never wait on the database. Admin changes refresh the cache straight away.
export const revalidate = 60;

export default async function SiteLayout({ children }) {
  const [contact, socials] = await Promise.all([publicContact(), publicSocials()]);
  const organizationId = siteUrl("/#organization");
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "OVIRA",
        alternateName: "OVIRASCIENCE",
        legalName: contact.companyName,
        url: siteUrl("/"),
        logo: { "@type": "ImageObject", url: siteUrl("/assets/ovira-logo.png") },
        email: contact.email || undefined,
        telephone: contact.phone || undefined,
        address: postalAddress(contact.address),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: contact.phone || undefined,
          email: contact.email || undefined,
        },
        // An empty sameAs list is reported as an invalid value, so leave it out until links exist.
        ...(socials.length ? { sameAs: socials.map(social => social.url) } : {}),
      },
      {
        "@type": "WebSite",
        "@id": siteUrl("/#website"),
        name: "OVIRA",
        url: siteUrl("/"),
        publisher: { "@id": organizationId },
        inLanguage: "en-IN",
      },
    ],
  };
  return <><SiteHeader /><JsonLd data={schema} />{children}<SiteFooter contact={contact} socials={socials} /></>;
}
