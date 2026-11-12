import "./globals.css";

export const metadata = { title: { default: "OVIRA", template: "%s — OVIRA" } };
export const viewport = { themeColor: "#faf7f3" };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
