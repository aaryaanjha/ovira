import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { publicContact } from "../../lib/store.mjs";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }) {
  const contact = await publicContact();
  return <><SiteHeader />{children}<SiteFooter contact={contact} /></>;
}
