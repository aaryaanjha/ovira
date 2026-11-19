import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import JsonLd from "../../components/JsonLd";
import { publicContact, publicSocials } from "../../lib/store.mjs";
import { siteUrl } from "../../lib/seo.mjs";

export const dynamic = "force-dynamic";

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
        email: contact.email,
        telephone: contact.phone,
        address: { "@type": "PostalAddress", streetAddress: contact.address, addressCountry: "IN" },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: contact.phone,
          email: contact.email,
        },
        sameAs: socials.map(social => social.url),
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
