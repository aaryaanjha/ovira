export const leadStatuses = ["New", "Contacted", "Follow-up Required", "Appointment Booked", "Closed", "Not Interested"];
export const appointmentStatuses = ["New Request", "Contacted", "Confirmed", "Completed", "Cancelled"];
export const postStatuses = ["Draft", "Published", "Archived"];
export const defaultContact = {
  companyName: "Shree Shyam Srijan Services Private Limited",
  address: "Plot No. 11, Office No. 319, Third Floor, Tower-3, Golden-i, Tech Zone-4, Greater Noida West, Gautam Buddha Nagar, Uttar Pradesh – 201318",
  phone: "+91 97180 02755", whatsapp: "919718002755", email: "info@ovirascience.com", mapsUrl: "",
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
