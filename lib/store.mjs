import { randomUUID } from "node:crypto";
import { append, replaceRow, rows, sheetsConfigured, updateLeadFields } from "./sheets.mjs";
import { defaultContact, leadStatuses, postStatuses } from "./content.mjs";
import { seedArticles } from "./seed.mjs";

export class InputError extends Error {}

function value(data, key, max, required = false) {
  const text = typeof data[key] === "string" ? data[key].trim() : "";
  if (required && !text) throw new InputError("Please enter " + key + ".");
  if (text.length > max) throw new InputError(key + " must be " + max + " characters or fewer.");
  return text;
}

const emailValid = text => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
const phoneValid = text => /^\+?[\d ().-]+$/.test(text) && /^\d{10,15}$/.test(text.replace(/\D/g, ""));

export async function newLead(data) {
  const id = value(data, "id", 36, true);
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) throw new InputError("Invalid request ID. Reload the form and try again.");
  const name = value(data, "name", 120, true);
  const phone = value(data, "phone", 40, true);
  const email = value(data, "email", 254);
  const contact = value(data, "contact", 10, true);
  if (!phoneValid(phone)) throw new InputError("Please enter a valid phone number.");
  if ((email && !emailValid(email)) || (contact === "Email" && !email)) throw new InputError("Please enter a valid email address.");
  if (!["Phone", "WhatsApp", "Email"].includes(contact)) throw new InputError("Please choose a contact method.");
  if (data.consent !== true) throw new InputError("Please agree to the Terms and Privacy Policy.");
  const address = value(data, "address", 250);
  const message = value(data, "message", 1000);
  if (data.website) return;
  if ((await rows("Leads")).some(lead => lead.id === id)) return;
  const now = new Date().toISOString();
  await append("Leads", { id, createdAt: now, name, phone, email, address, contact, message, consent: "Yes", status: "New", notes: "", updatedAt: now });
}

export async function adminLeads() {
  return (await rows("Leads")).reverse().map(({ row, ...lead }) => lead);
}

export async function saveLead(data) {
  const id = value(data, "id", 36, true);
  const status = value(data, "status", 20, true);
  const notes = value(data, "notes", 2000);
  if (!leadStatuses.includes(status)) throw new InputError("Choose a valid lead status.");
  const lead = (await rows("Leads")).find(item => item.id === id);
  if (!lead) throw new InputError("Lead not found.");
  if (lead.updatedAt !== data.updatedAt) throw new InputError("This lead has changed. Reload the dashboard before editing it.");
  await updateLeadFields(lead.row, [status, notes, new Date().toISOString()]);
}

const isoDate = date => new Date(date + " UTC").toISOString();

export const initialPosts = seedArticles.map(article => ({
  ...article, status: "Published", publishedAt: isoDate(article.date), updatedAt: isoDate(article.date),
}));

function decodePost({ row, sections, ...post }) {
  let parsed;
  try { parsed = JSON.parse(sections); } catch { parsed = []; }
  return { ...post, sections: Array.isArray(parsed) ? parsed.filter(section =>
    Array.isArray(section) && section.length === 2 && section.every(item => typeof item === "string")
  ) : [] };
}

export async function publicArticles() {
  if (!sheetsConfigured()) return initialPosts;
  return (await rows("Posts")).filter(post => post.status === "Published").map(decodePost)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function adminPosts() {
  return (await rows("Posts")).map(decodePost).reverse();
}

export async function savePost(data) {
  const id = value(data, "id", 100);
  const status = value(data, "status", 20, true);
  if (!postStatuses.includes(status)) throw new InputError("Choose a valid post status.");
  const title = value(data, "title", 160, true);
  const category = value(data, "category", 70, true);
  const description = value(data, "description", 300, status === "Published");
  const intro = value(data, "intro", 2500, status === "Published");
  if (!Array.isArray(data.sections) || data.sections.length > 20) throw new InputError("Include up to 20 article sections.");
  const sections = data.sections.map(section => {
    if (!Array.isArray(section)) throw new InputError("Invalid article section.");
    return [value({ heading: section[0] }, "heading", 160, true), value({ body: section[1] }, "body", 5000, true)];
  });
  const serialized = JSON.stringify(sections);
  if (serialized.length > 45000) throw new InputError("Please shorten the article.");
  if (status === "Published" && !sections.length) throw new InputError("Add at least one section before publishing.");

  const current = id ? (await rows("Posts")).find(item => item.id === id) : null;
  if (id && !current) throw new InputError("Post not found.");
  if (current && current.updatedAt !== data.updatedAt) throw new InputError("This post has changed. Reload before editing it.");
  const updatedAt = new Date().toISOString();
  const publishedAt = current?.publishedAt || (status === "Published" ? updatedAt : "");
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65) || "post";
  const post = { id: id || slug + "-" + randomUUID().slice(0, 8), status, title, category, description, intro, sections: serialized, publishedAt, updatedAt };
  if (current) await replaceRow("Posts", current.row, post);
  else await append("Posts", post);
  return decodePost(post);
}

export async function publicContact() {
  if (!sheetsConfigured()) return defaultContact;
  const [contact] = await rows("Settings");
  if (!contact) return defaultContact;
  return { phone: contact.phone, whatsapp: contact.whatsapp, email: contact.email };
}

export async function saveContact(data) {
  const phone = value(data, "phone", 40, true);
  const whatsapp = value(data, "whatsapp", 40, true).replace(/[+\s-]/g, "");
  const email = value(data, "email", 254, true);
  if (!phoneValid(phone)) throw new InputError("Enter a valid public phone number.");
  if (!/^[1-9]\d{9,14}$/.test(whatsapp)) throw new InputError("Enter a WhatsApp number with its country code.");
  if (!emailValid(email)) throw new InputError("Enter a valid public email address.");
  await replaceRow("Settings", 2, { phone, whatsapp, email });
}
