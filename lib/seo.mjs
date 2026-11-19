const configuredOrigin = process.env.APP_ORIGIN?.trim() || "https://www.ovirascience.com";

export const siteOrigin = new URL(configuredOrigin).origin;
export const siteUrl = path => new URL(path, siteOrigin + "/").toString();

export function pageMetadata({ title, description, path }) {
  const socialTitle = title + " | OVIRA";
  const image = {
    url: "/assets/ovira-share.jpg",
    width: 1200,
    height: 630,
    alt: "OVIRA fertility care and IVF information",
  };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", title: socialTitle, description, url: path, images: [image] },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [image.url] },
  };
}
