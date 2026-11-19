import "./globals.css";
import "./design.css";
import { Cormorant_Garamond, Lora } from "next/font/google";
import { siteUrl } from "../lib/seo.mjs";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-lora",
});
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant-garamond",
});

export const metadata = {
  metadataBase: new URL(siteUrl("/")),
  title: { default: "Fertility Care & IVF Guidance", template: "%s | OVIRA" },
  description: "Explore compassionate fertility information, IVF guidance, and clear answers to common questions from OVIRA.",
  applicationName: "OVIRA",
  publisher: "OVIRA",
  category: "Fertility care",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "OVIRA",
    title: "Fertility Care & IVF Guidance | OVIRA",
    description: "Explore compassionate fertility care, IVF guidance, and clear answers to common fertility questions from OVIRA.",
    url: "/",
    images: [{ url: "/assets/ovira-share.jpg", width: 1200, height: 630, alt: "OVIRA fertility care and IVF information" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fertility Care & IVF Guidance | OVIRA",
    description: "Compassionate fertility care, IVF guidance, and clear answers from OVIRA.",
    images: ["/assets/ovira-share.jpg"],
  },
};
export const viewport = { themeColor: "#FFFFFF" };

export default function RootLayout({ children }) {
  return <html lang="en-IN"><body className={`${lora.variable} ${cormorantGaramond.variable} site-fonts`}>{children}</body></html>;
}
