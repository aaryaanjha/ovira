import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { publicContact, publicSocials } from "../../lib/store.mjs";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }) {
  const [contact, socials] = await Promise.all([publicContact(), publicSocials()]);
  return <><SiteHeader />{children}<SiteFooter contact={contact} socials={socials} /></>;
}
