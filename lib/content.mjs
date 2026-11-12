export const leadStatuses = ["New", "Contacted", "Booked", "Closed"];
export const postStatuses = ["Draft", "Published", "Archived"];
export const defaultContact = {
  phone: "+91 97180 02755", whatsapp: "919718002755", email: "info@ovirascience.com",
};

export function contactLinks(contact) {
  return {
    phone: "tel:" + contact.phone.replace(/[^\d+]/g, ""),
    whatsapp: "https://wa.me/" + contact.whatsapp.replace(/\D/g, ""),
    email: "mailto:" + contact.email,
  };
}

export function dateLabel(date) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.valueOf()) ? "" : new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(parsed);
}
