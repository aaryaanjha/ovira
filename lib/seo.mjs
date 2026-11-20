const defaultOrigin = "https://www.ovirascience.com";

function resolveOrigin(value) {
  const text = (value || "").trim().replace(/\/+$/, "");
  if (!text) return defaultOrigin;
  try {
    return new URL(/^https?:\/\//i.test(text) ? text : "https://" + text).origin;
  } catch {
    return defaultOrigin;
  }
}

export const siteOrigin = resolveOrigin(process.env.APP_ORIGIN);
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

// BreadcrumbList for pages one level below home (playbook: every page below home gets one).
export function breadcrumbSchema(name, path) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
      { "@type": "ListItem", position: 2, name, item: siteUrl(path) },
    ],
  };
}
