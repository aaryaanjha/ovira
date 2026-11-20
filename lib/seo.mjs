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

// Search tools flag <title> elements longer than about 60 characters. Add " | OVIRA" only when
// it fits; otherwise shorten the title at a word boundary so it is never cut off mid-word.
export const maxTitleLength = 60;
const brandSuffix = " | OVIRA";

export function fullTitle(title) {
  const text = String(title || "").replace(/\s+/g, " ").trim() || "OVIRA";
  const named = /\bOVIRA\b/i.test(text);
  if (!named && (text + brandSuffix).length <= maxTitleLength) return text + brandSuffix;
  if (text.length <= maxTitleLength) return text;
  const cut = text.slice(0, maxTitleLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.:;–—-]+$/, "") + "…";
}

// Search descriptions are cut off around 160 characters.
export function shortDescription(text, max = 160) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.:;–—-]+$/, "") + "…";
}

export function pageMetadata({ title: pageTitle, description: pageDescription, path }) {
  const socialTitle = fullTitle(pageTitle);
  const title = { absolute: socialTitle };
  const description = shortDescription(pageDescription);
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

// Splits the free-text company address into schema.org PostalAddress fields where they can be
// recognised (an Indian 6-digit PIN code and a known state name); the full text stays in streetAddress.
const indianStates = ["Uttar Pradesh", "Delhi", "Haryana", "Maharashtra", "Karnataka", "Tamil Nadu", "Telangana",
  "West Bengal", "Gujarat", "Rajasthan", "Punjab", "Kerala", "Madhya Pradesh", "Bihar", "Uttarakhand"];
export function postalAddress(address) {
  const text = String(address || "").replace(/\s+/g, " ").trim();
  const result = { "@type": "PostalAddress", addressCountry: "IN" };
  if (!text) return result;
  const postalCode = text.match(/\b\d{6}\b/)?.[0];
  const region = indianStates.find(state => new RegExp("\\b" + state + "\\b", "i").test(text));
  let street = text;
  if (region) street = street.slice(0, street.search(new RegExp("\\b" + region + "\\b", "i")));
  street = street.replace(/[\s,–—-]+$/, "");
  const parts = street.split(",").map(part => part.trim()).filter(Boolean);
  if (region && parts.length > 2) {
    result.addressLocality = parts.at(-1);
    result.streetAddress = parts.slice(0, -1).join(", ");
  } else {
    result.streetAddress = region ? street : text;
  }
  if (region) result.addressRegion = region;
  if (postalCode) result.postalCode = postalCode;
  return result;
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
