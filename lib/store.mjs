import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { database, describeDatabaseError, hasPersistentDatabase, withTimeout } from "./database.mjs";
import { appointmentStatuses, defaultContact, leadStatuses, postStatuses } from "./content.mjs";
import { myths, seedArticles } from "./seed.mjs";
import {
  append as appendSheetRow, rows as sheetRows, sheetsConfigured, updateAppointmentFields, updateLeadFields,
} from "./sheets.mjs";

export class InputError extends Error {}

const now = () => new Date().toISOString();
const requiredText = (data, name, max) => {
  const text = typeof data[name] === "string" ? data[name].trim() : "";
  if (!text) throw new InputError("Please enter " + name + ".");
  if (text.length > max) throw new InputError(name + " must be " + max + " characters or fewer.");
  return text;
};
const optionalText = (data, name, max) => {
  const text = typeof data[name] === "string" ? data[name].trim() : "";
  if (text.length > max) throw new InputError(name + " must be " + max + " characters or fewer.");
  return text;
};
const emailValid = text => !text || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
const phoneValid = text => /^\+?[\d ().-]+$/.test(text) && /^\d{10,15}$/.test(text.replace(/\D/g, ""));
const enabledValue = value => value === true || value === 1 || value === "true" || value === "on";
const asBool = value => Boolean(Number(value));
async function validImageReference(value) {
  if (!value) return true;
  const uploaded = value.match(/^\/media\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i);
  if (uploaded) return Boolean(await database().prepare("SELECT 1 FROM media WHERE id=?").get(uploaded[1]));
  const asset = value.match(/^\/assets\/([a-zA-Z0-9._-]+)$/);
  return Boolean(asset && existsSync(path.join(process.cwd(), "public", "assets", asset[1])));
}
const safeSections = value => {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed) || parsed.some(section => !Array.isArray(section) || section.length !== 2 ||
      section.some(item => typeof item !== "string"))) throw new Error();
    return parsed;
  } catch {
    throw new Error("Stored article content is invalid.");
  }
};
const slugify = value => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export const initialPosts = seedArticles.map(article => ({
  ...article, slug: article.id, status: "Published",
  publishedAt: new Date(article.date + " UTC").toISOString(),
  updatedAt: new Date(article.date + " UTC").toISOString(),
  author: "OVIRA", featuredImage: "", seoTitle: article.title, metaDescription: article.description,
}));

export { hasPersistentDatabase };

export function usesGoogleSheetsForAppointments() {
  return sheetsConfigured() && (!hasPersistentDatabase() || process.env.OVIRA_APPOINTMENT_STORAGE === "google-sheets");
}

export function hasAppointmentStorage() {
  return hasPersistentDatabase() || sheetsConfigured();
}

export function sheetsOnlyAdmin() {
  return usesGoogleSheetsForAppointments() && !hasPersistentDatabase();
}

function decodeSheetLead(row) {
  return { ...row, consent: ["true", "1"].includes(row.consent.toLowerCase()) };
}

function decodePost(post) {
  return { ...post, sections: safeSections(post.sections) };
}

function decodeContact(row) {
  if (!row) return { ...defaultContact };
  return { ...row };
}

export async function newLead(data) {
  const id = requiredText(data, "id", 36);
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
    throw new InputError("Invalid request ID. Reload the form and try again.");
  }
  const name = requiredText(data, "name", 120);
  const phone = requiredText(data, "phone", 40);
  const email = optionalText(data, "email", 254);
  const contactMethod = requiredText(data, "contact", 10);
  if (!phoneValid(phone)) throw new InputError("Please enter a valid phone number.");
  if (!emailValid(email) || (contactMethod === "Email" && !email)) throw new InputError("Please enter a valid email address.");
  if (!["Phone", "WhatsApp", "Email"].includes(contactMethod)) throw new InputError("Please choose a valid contact method.");
  if (data.consent !== true) throw new InputError("Please agree to the Terms and Privacy Policy.");
  if (data.website) return;
  const address = optionalText(data, "address", 250);
  const message = optionalText(data, "message", 1000);
  const preferredDate = optionalText(data, "preferredDate", 10);
  const preferredTime = optionalText(data, "preferredTime", 40);
  if (preferredDate) {
    const parsedDate = Date.parse(preferredDate + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || Number.isNaN(parsedDate) ||
      new Date(parsedDate).toISOString().slice(0, 10) !== preferredDate) throw new InputError("Choose a valid preferred date.");
  }
  if (preferredTime && !/^\d{2}:\d{2}$/.test(preferredTime)) throw new InputError("Choose a valid preferred time.");
  const timestamp = now();
  if (usesGoogleSheetsForAppointments()) {
    if ((await sheetRows("Leads")).some(row => row.id === id)) return;
    await appendSheetRow("Leads", {
      id, createdAt: timestamp, name, phone, email, address, contact: contactMethod, message,
      consent: "true", status: "New", notes: "", updatedAt: timestamp, source: "/appointment",
      preferredDate, preferredTime, appointmentStatus: "New Request", appointmentNotes: "",
    });
    return;
  }
  const db = database();
  if (await db.prepare("SELECT 1 FROM leads WHERE id = ?").get(id)) return;
  await db.transaction([
    {
      sql: `INSERT OR IGNORE INTO leads (id, createdAt, name, phone, email, address, contact, message, consent, status,
        notes, updatedAt, source, preferredDate, preferredTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'New', '', ?, ?, ?, ?)`,
      params: [id, timestamp, name, phone, email, address, contactMethod, message, timestamp, "/appointment", preferredDate, preferredTime],
    },
    {
      sql: `INSERT OR IGNORE INTO appointments (id, leadId, createdAt, name, phone, email, preferredDate, preferredTime,
        message, status, notes, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Request', '', ?)`,
      params: [randomUUID(), id, timestamp, name, phone, email, preferredDate, preferredTime, message, timestamp],
    },
  ]);
}

export async function adminLeads() {
  if (usesGoogleSheetsForAppointments()) {
    return (await sheetRows("Leads")).map(decodeSheetLead).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return (await database().prepare("SELECT * FROM leads ORDER BY createdAt DESC").all()).map(row => ({
    ...row, consent: asBool(row.consent),
  }));
}

export async function saveLead(data) {
  const id = requiredText(data, "id", 36);
  const status = requiredText(data, "status", 40);
  const notes = optionalText(data, "notes", 2000);
  if (!leadStatuses.includes(status)) throw new InputError("Choose a valid lead status.");
  if (usesGoogleSheetsForAppointments()) {
    const current = (await sheetRows("Leads")).find(row => row.id === id);
    if (!current || current.updatedAt !== data.updatedAt) {
      throw new InputError("This lead has changed or no longer exists. Refresh before editing.");
    }
    await updateLeadFields(current.row, [status, notes, now()]);
    return;
  }
  const result = await database().prepare("UPDATE leads SET status = ?, notes = ?, updatedAt = ? WHERE id = ? AND updatedAt = ?")
    .run(status, notes, now(), id, data.updatedAt);
  if (!result.changes) throw new InputError("This lead has changed or no longer exists. Refresh before editing.");
}

export async function adminAppointments() {
  if (usesGoogleSheetsForAppointments()) {
    return (await sheetRows("Leads")).map(decodeSheetLead).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(row => ({
      ...row,
      leadId: row.id,
      status: row.appointmentStatus || "New Request",
      notes: row.appointmentNotes,
    }));
  }
  return database().prepare("SELECT * FROM appointments ORDER BY createdAt DESC").all();
}

export async function saveAppointment(data) {
  const id = requiredText(data, "id", 36);
  const status = requiredText(data, "status", 30);
  const notes = optionalText(data, "notes", 2000);
  if (!appointmentStatuses.includes(status)) throw new InputError("Choose a valid appointment status.");
  if (usesGoogleSheetsForAppointments()) {
    const current = (await sheetRows("Leads")).find(row => row.id === id);
    if (!current || current.updatedAt !== data.updatedAt) {
      throw new InputError("This appointment has changed or no longer exists. Refresh before editing.");
    }
    await updateAppointmentFields(current.row, { status, notes, updatedAt: now() });
    return;
  }
  const result = await database().prepare("UPDATE appointments SET status = ?, notes = ?, updatedAt = ? WHERE id = ? AND updatedAt = ?")
    .run(status, notes, now(), id, data.updatedAt);
  if (!result.changes) throw new InputError("This appointment has changed or no longer exists. Refresh before editing.");
}

// Public pages must keep rendering when the database is missing or unreachable:
// fall back to the built-in content and log the cause (never the data) for the operator.
// Each read is capped at a few seconds, and after a failure the database is skipped for a short
// while so every visitor is not made to wait (and Supabase is not flooded with failing logins).
const publicReadTimeout = 3500;
const databaseRetryDelay = 30000;
let databaseDownUntil = 0;

async function publicRead(label, read, fallback) {
  if (!hasPersistentDatabase() || Date.now() < databaseDownUntil) return fallback();
  try {
    return await withTimeout(read(), publicReadTimeout, "Loading " + label);
  } catch (error) {
    databaseDownUntil = Date.now() + databaseRetryDelay;
    console.error("Database unavailable while loading " + label + ": " + describeDatabaseError(error).detail);
    return fallback();
  }
}

export async function publicArticles() {
  return publicRead("articles",
    async () => (await database().prepare("SELECT * FROM posts WHERE status = 'Published' ORDER BY publishedAt DESC").all()).map(decodePost),
    () => initialPosts
      .map(article => ({ ...article, sections: article.sections.map(section => [...section]) }))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)));
}

export async function adminPosts() {
  return (await database().prepare("SELECT * FROM posts ORDER BY updatedAt DESC").all()).map(decodePost);
}

export async function savePost(data) {
  const title = requiredText(data, "title", 160);
  const suppliedId = optionalText(data, "id", 36);
  const id = suppliedId || randomUUID();
  const category = requiredText(data, "category", 70);
  const status = requiredText(data, "status", 20);
  const description = optionalText(data, "description", 300);
  const intro = optionalText(data, "intro", 2500);
  const author = optionalText(data, "author", 100) || "OVIRA";
  const featuredImage = optionalText(data, "featuredImage", 500);
  const seoTitle = optionalText(data, "seoTitle", 160);
  const metaDescription = optionalText(data, "metaDescription", 300);
  if (!postStatuses.includes(status)) throw new InputError("Choose a valid blog status.");
  if (status === "Published" && (!description || !intro)) throw new InputError("Add a summary and introduction before publishing.");
  if (!Array.isArray(data.sections) || data.sections.length > 20) throw new InputError("Include up to 20 blog sections.");
  const sections = data.sections.map(section => {
    if (!Array.isArray(section) || section.length !== 2) throw new InputError("A blog section is invalid.");
    return [requiredText({ heading: section[0] }, "heading", 160), requiredText({ body: section[1] }, "body", 5000)];
  });
  if (status === "Published" && !sections.length) throw new InputError("Add at least one section before publishing.");
  const slugInput = optionalText(data, "slug", 80);
  const slug = slugify(slugInput || title);
  if (!slug) throw new InputError("Enter a title that can form a URL slug.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new InputError("Use lowercase letters, numbers, and hyphens in the URL slug.");
  const current = await database().prepare("SELECT * FROM posts WHERE id = ?").get(id);
  if (suppliedId && !current) throw new InputError("Blog not found.");
  if (current && current.updatedAt !== data.updatedAt) throw new InputError("This blog has changed. Refresh before editing.");
  if (await database().prepare("SELECT id FROM posts WHERE slug = ? AND id != ?").get(slug, id)) {
    throw new InputError("That URL slug is already in use.");
  }
  if (!await validImageReference(featuredImage)) throw new InputError("Choose an existing site image or upload a valid image.");
  const timestamp = now();
  const publishedAt = current?.publishedAt || (status === "Published" ? timestamp : "");
  const post = {
    id, slug, status, title, category, description, intro, sections: JSON.stringify(sections), featuredImage, author,
    publishedAt, updatedAt: timestamp, seoTitle, metaDescription,
  };
  if (current) {
    await database().prepare(`UPDATE posts SET slug=?, status=?, title=?, category=?, description=?, intro=?, sections=?,
      featuredImage=?, author=?, publishedAt=?, updatedAt=?, seoTitle=?, metaDescription=? WHERE id=?`)
      .run(post.slug, post.status, post.title, post.category, post.description, post.intro, post.sections,
        post.featuredImage, post.author, post.publishedAt, post.updatedAt, post.seoTitle, post.metaDescription, post.id);
  } else {
    await database().prepare(`INSERT INTO posts (id, slug, status, title, category, description, intro, sections, featuredImage,
      author, publishedAt, updatedAt, seoTitle, metaDescription) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(post.id, post.slug, post.status, post.title, post.category, post.description, post.intro, post.sections,
        post.featuredImage, post.author, post.publishedAt, post.updatedAt, post.seoTitle, post.metaDescription);
  }
  return decodePost(post);
}

export async function deletePost(id) {
  const result = await database().prepare("DELETE FROM posts WHERE id = ?").run(requiredText({ id }, "id", 36));
  if (!result.changes) throw new InputError("Blog not found.");
}

export async function publicMyths() {
  return publicRead("myths",
    () => database().prepare("SELECT * FROM myths WHERE status='Published' ORDER BY position, createdAt").all(),
    () => myths.map((item, index) => ({ ...item, id: "seed-myth-" + (index + 1) })));
}

export async function adminMyths() {
  return database().prepare("SELECT * FROM myths ORDER BY position, createdAt").all();
}

export async function saveMyth(data) {
  const suppliedId = optionalText(data, "id", 36);
  const id = suppliedId || randomUUID();
  const myth = requiredText(data, "myth", 500);
  const fact = requiredText(data, "fact", 3000);
  const more = optionalText(data, "more", 5000);
  const status = requiredText(data, "status", 20);
  if (!["Draft", "Published", "Archived"].includes(status)) throw new InputError("Choose a valid myth status.");
  const position = Number.isInteger(Number(data.position)) ? Math.max(0, Math.min(10000, Number(data.position))) : 0;
  const current = await database().prepare("SELECT * FROM myths WHERE id = ?").get(id);
  if (suppliedId && !current) throw new InputError("Myth not found.");
  const timestamp = now();
  if (current) await database().prepare("UPDATE myths SET myth=?, fact=?, more=?, status=?, position=?, updatedAt=? WHERE id=?")
    .run(myth, fact, more, status, position, timestamp, id);
  else await database().prepare(`INSERT INTO myths (id, myth, fact, more, status, position, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, myth, fact, more, status, position, timestamp, timestamp);
  return database().prepare("SELECT * FROM myths WHERE id=?").get(id);
}

export async function deleteMyth(id) {
  const result = await database().prepare("DELETE FROM myths WHERE id=?").run(requiredText({ id }, "id", 36));
  if (!result.changes) throw new InputError("Myth not found.");
}

export async function publicTestimonials() {
  return publicRead("testimonials",
    () => database().prepare("SELECT * FROM testimonials WHERE status='Published' ORDER BY position, createdAt").all(),
    () => []);
}

export async function adminTestimonials() {
  return database().prepare("SELECT * FROM testimonials ORDER BY position, createdAt").all();
}

export async function saveTestimonial(data) {
  const suppliedId = optionalText(data, "id", 36);
  const id = suppliedId || randomUUID();
  const name = requiredText(data, "name", 120);
  const content = requiredText(data, "content", 3000);
  const details = optionalText(data, "details", 200);
  const profileImage = optionalText(data, "profileImage", 500);
  const status = requiredText(data, "status", 20);
  if (!["Draft", "Published", "Archived"].includes(status)) throw new InputError("Choose a valid testimonial status.");
  const ratingText = optionalText(data, "rating", 1);
  const rating = ratingText ? Number(ratingText) : null;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) throw new InputError("Rating must be between 1 and 5.");
  if (!await validImageReference(profileImage)) throw new InputError("Choose an existing site image or upload a valid image.");
  const position = Number.isInteger(Number(data.position)) ? Math.max(0, Math.min(10000, Number(data.position))) : 0;
  const current = await database().prepare("SELECT * FROM testimonials WHERE id=?").get(id);
  if (suppliedId && !current) throw new InputError("Testimonial not found.");
  const timestamp = now();
  if (current) await database().prepare(`UPDATE testimonials SET name=?, content=?, details=?, profileImage=?, rating=?,
    status=?, position=?, updatedAt=? WHERE id=?`).run(name, content, details, profileImage, rating, status, position, timestamp, id);
  else await database().prepare(`INSERT INTO testimonials (id, name, content, details, profileImage, rating, status, position,
    createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, name, content, details, profileImage, rating, status, position, timestamp, timestamp);
  return database().prepare("SELECT * FROM testimonials WHERE id=?").get(id);
}

export async function deleteTestimonial(id) {
  const result = await database().prepare("DELETE FROM testimonials WHERE id=?").run(requiredText({ id }, "id", 36));
  if (!result.changes) throw new InputError("Testimonial not found.");
}

export async function adminSlides() {
  return (await database().prepare("SELECT * FROM slides ORDER BY position, createdAt").all()).map(slide => ({
    ...slide, enabled: asBool(slide.enabled),
  }));
}

const defaultSlides = [
  { id: "consultation", image: "/assets/ivf-consultation.webp", alt: "Fertility specialist listening to a couple during a consultation", caption: "Care that begins by listening" },
  { id: "laboratory", image: "/assets/ivf-lab.webp", alt: "Embryologist working carefully in a modern IVF laboratory", caption: "Science guided by care" },
  { id: "guidance", image: "/assets/ivf-guidance.webp", alt: "Fertility specialist reviewing personalized care options with a patient", caption: "Your journey, your next step" },
];

export async function publicSlides() {
  return publicRead("slides",
    async () => (await database().prepare("SELECT id, image, alt, caption FROM slides WHERE enabled=1 ORDER BY position, createdAt").all())
      .map(slide => ({ id: slide.id, image: slide.image, alt: slide.alt, caption: slide.caption })),
    () => defaultSlides.map(slide => ({ ...slide })));
}

export async function saveSlide(data) {
  const suppliedId = optionalText(data, "id", 36);
  const id = suppliedId || randomUUID();
  const image = requiredText(data, "image", 500);
  const alt = requiredText(data, "alt", 250);
  const caption = requiredText(data, "caption", 160);
  if (!await validImageReference(image)) throw new InputError("Choose an existing site image or upload a valid image.");
  const position = Number.isInteger(Number(data.position)) ? Math.max(0, Math.min(10000, Number(data.position))) : 0;
  const enabled = enabledValue(data.enabled) ? 1 : 0;
  const current = await database().prepare("SELECT id FROM slides WHERE id=?").get(id);
  if (suppliedId && !current) throw new InputError("Slide not found.");
  const timestamp = now();
  if (current) await database().prepare("UPDATE slides SET image=?, alt=?, caption=?, enabled=?, position=?, updatedAt=? WHERE id=?")
    .run(image, alt, caption, enabled, position, timestamp, id);
  else await database().prepare(`INSERT INTO slides (id, image, alt, caption, enabled, position, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, image, alt, caption, enabled, position, timestamp, timestamp);
  return database().prepare("SELECT * FROM slides WHERE id=?").get(id);
}

export async function deleteSlide(id) {
  const result = await database().prepare("DELETE FROM slides WHERE id=?").run(requiredText({ id }, "id", 36));
  if (!result.changes) throw new InputError("Slide not found.");
}

export async function publicContact() {
  return publicRead("contact details",
    async () => decodeContact(await database().prepare("SELECT * FROM contact WHERE id=1").get()),
    () => ({ ...defaultContact }));
}

export async function saveContact(data) {
  const companyName = requiredText(data, "companyName", 200);
  const address = requiredText(data, "address", 500);
  const phone = requiredText(data, "phone", 40);
  const whatsapp = requiredText(data, "whatsapp", 40).replace(/[+\s-]/g, "");
  const email = requiredText(data, "email", 254);
  const mapsUrl = optionalText(data, "mapsUrl", 500);
  if (!phoneValid(phone)) throw new InputError("Enter a valid public phone number.");
  if (!/^[1-9]\d{9,14}$/.test(whatsapp)) throw new InputError("Enter a WhatsApp number with its country code.");
  if (!emailValid(email)) throw new InputError("Enter a valid email address.");
  if (mapsUrl && !/^https:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps|maps\.google\.com)\//i.test(mapsUrl)) {
    throw new InputError("Enter a valid Google Maps link.");
  }
  await database().prepare(`UPDATE contact SET companyName=?, address=?, phone=?, whatsapp=?, email=?, mapsUrl=? WHERE id=1`)
    .run(companyName, address, phone, whatsapp, email, mapsUrl);
  return publicContact();
}

export async function adminSocials() {
  return (await database().prepare("SELECT * FROM socials ORDER BY position, platform").all()).map(social => ({
    ...social, enabled: asBool(social.enabled),
  }));
}

export async function publicSocials() {
  return publicRead("social links",
    () => database().prepare("SELECT platform, url FROM socials WHERE enabled=1 AND url LIKE 'https://%' ORDER BY position, platform").all(),
    () => []);
}

export async function saveSocial(data) {
  const id = optionalText(data, "id", 36) || randomUUID();
  const platform = requiredText(data, "platform", 50);
  const url = optionalText(data, "url", 500);
  const enabled = enabledValue(data.enabled) ? 1 : 0;
  if (enabled && !url) throw new InputError("Add a link before enabling this platform.");
  if (url) {
    let parsed;
    try { parsed = new URL(url); } catch { throw new InputError("Enter a valid social link."); }
    if (parsed.protocol !== "https:") throw new InputError("Social links must use HTTPS.");
  }
  const position = Number.isInteger(Number(data.position)) ? Math.max(0, Math.min(10000, Number(data.position))) : 0;
  const current = await database().prepare("SELECT id FROM socials WHERE id=?").get(id);
  const timestamp = now();
  if (current) await database().prepare("UPDATE socials SET platform=?, url=?, enabled=?, position=?, updatedAt=? WHERE id=?")
    .run(platform, url, enabled, position, timestamp, id);
  else await database().prepare("INSERT INTO socials (id, platform, url, enabled, position, updatedAt) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, platform, url, enabled, position, timestamp);
  return database().prepare("SELECT * FROM socials WHERE id=?").get(id);
}

export async function deleteSocial(id) {
  const result = await database().prepare("DELETE FROM socials WHERE id=?").run(requiredText({ id }, "id", 36));
  if (!result.changes) throw new InputError("Social link not found.");
}

export async function adminMedia() {
  return database().prepare("SELECT * FROM media ORDER BY createdAt DESC").all();
}

export async function addMedia(data) {
  const id = optionalText(data, "id", 36) || randomUUID();
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) throw new InputError("Invalid image ID.");
  await database().prepare("INSERT INTO media (id, fileName, mimeType, size, createdAt, url) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, requiredText(data, "fileName", 160), requiredText(data, "mimeType", 40), Number(data.size), now(),
      optionalText(data, "url", 2000));
  return database().prepare("SELECT * FROM media WHERE id=?").get(id);
}

export async function findMedia(id) {
  return (await database().prepare("SELECT * FROM media WHERE id=?").get(id)) || null;
}

export async function deleteMedia(id) {
  const media = await findMedia(requiredText({ id }, "id", 36));
  if (!media) throw new InputError("Image not found.");
  const inUse = await database().prepare(`SELECT
    (SELECT COUNT(*) FROM posts WHERE featuredImage = ?) +
    (SELECT COUNT(*) FROM testimonials WHERE profileImage = ?) +
    (SELECT COUNT(*) FROM slides WHERE image = ?) AS count`).get("/media/" + id, "/media/" + id, "/media/" + id);
  if (inUse.count) throw new InputError("This image is in use. Replace it before deleting.");
  await database().prepare("DELETE FROM media WHERE id=?").run(id);
  return media;
}

export async function adminAnalytics() {
  if (usesGoogleSheetsForAppointments()) {
    const leads = (await sheetRows("Leads")).map(decodeSheetLead);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 13);
    const cutoff = start.toISOString().slice(0, 10);
    const countsByDay = records => {
      const counts = new Map();
      for (const record of records) {
        const day = record.createdAt.slice(0, 10);
        if (day >= cutoff) counts.set(day, (counts.get(day) || 0) + 1);
      }
      return [...counts].map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day));
    };
    const appointmentRows = leads.map(row => ({ ...row, status: row.appointmentStatus || "New Request" }));
    const statusCounts = new Map();
    for (const lead of leads) statusCounts.set(lead.status || "New", (statusCounts.get(lead.status || "New") || 0) + 1);
    return {
      summary: {
        totalLeads: leads.length,
        newLeads: leads.filter(row => (row.status || "New") === "New").length,
        totalAppointments: appointmentRows.length,
        pendingFollowUps: appointmentRows.filter(row => ["New Request", "Contacted"].includes(row.status)).length,
      },
      leadStatuses: [...statusCounts].map(([status, count]) => ({ status, count })),
      leadsByDay: countsByDay(leads),
      appointmentTrends: countsByDay(appointmentRows),
      recentLeads: leads.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      recentAppointments: appointmentRows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      recentBlogs: [],
      recentTestimonials: [],
    };
  }
  const db = database();
  const leadStatusesData = await db.prepare("SELECT status, COUNT(*) AS count FROM leads GROUP BY status ORDER BY status").all();
  const leadsByDay = await db.prepare(`SELECT substr(createdAt, 1, 10) AS day, COUNT(*) AS count FROM leads
    WHERE createdAt >= ? GROUP BY day ORDER BY day`).all(new Date(Date.now() - 13 * 86400000).toISOString());
  const appointmentTrends = await db.prepare(`SELECT substr(createdAt, 1, 10) AS day, COUNT(*) AS count FROM appointments
    WHERE createdAt >= ? GROUP BY day ORDER BY day`).all(new Date(Date.now() - 13 * 86400000).toISOString());
  const totalLeads = (await db.prepare("SELECT COUNT(*) AS count FROM leads").get()).count;
  const newLeads = (await db.prepare("SELECT COUNT(*) AS count FROM leads WHERE status='New'").get()).count;
  const totalAppointments = (await db.prepare("SELECT COUNT(*) AS count FROM appointments").get()).count;
  const pendingFollowUps = (await db.prepare("SELECT COUNT(*) AS count FROM appointments WHERE status IN ('New Request','Contacted')").get()).count;
  return {
    summary: { totalLeads, newLeads, totalAppointments, pendingFollowUps },
    leadStatuses: leadStatusesData,
    leadsByDay,
    appointmentTrends,
    recentLeads: await db.prepare("SELECT id, name, createdAt, status FROM leads ORDER BY createdAt DESC LIMIT 5").all(),
    recentAppointments: await db.prepare("SELECT id, name, createdAt, status FROM appointments ORDER BY createdAt DESC LIMIT 5").all(),
    recentBlogs: await db.prepare("SELECT id, slug, title, updatedAt FROM posts WHERE status='Published' ORDER BY updatedAt DESC LIMIT 5").all(),
    recentTestimonials: await db.prepare("SELECT id, name, updatedAt FROM testimonials WHERE status='Published' ORDER BY updatedAt DESC LIMIT 5").all(),
  };
}
