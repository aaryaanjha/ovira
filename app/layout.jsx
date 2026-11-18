import "./globals.css";
import "./design.css";

export const metadata = { title: { default: "OVIRA", template: "%s — OVIRA" } };
export const viewport = { themeColor: "#FFFFFF" };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
