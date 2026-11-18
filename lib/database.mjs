import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { defaultContact } from "./content.mjs";
import { legacyMyths, myths, seedArticles } from "./seed.mjs";

const databaseKey = "__oviraDatabase";

function openDatabase() {
  const file = process.env.OVIRA_DB_PATH || path.join(process.cwd(), ".data", "ovira.sqlite");
  mkdirSync(path.dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY, createdAt TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', contact TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '', consent INTEGER NOT NULL, status TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '', updatedAt TEXT NOT NULL, source TEXT NOT NULL DEFAULT '',
      preferredDate TEXT NOT NULL DEFAULT '', preferredTime TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY, leadId TEXT NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
      createdAt TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL DEFAULT '',
      preferredDate TEXT NOT NULL DEFAULT '', preferredTime TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '', status TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, status TEXT NOT NULL, title TEXT NOT NULL,
      category TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', intro TEXT NOT NULL DEFAULT '',
      sections TEXT NOT NULL DEFAULT '[]', featuredImage TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT '', publishedAt TEXT NOT NULL DEFAULT '', updatedAt TEXT NOT NULL,
      seoTitle TEXT NOT NULL DEFAULT '', metaDescription TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS myths (
      id TEXT PRIMARY KEY, myth TEXT NOT NULL, fact TEXT NOT NULL, more TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, content TEXT NOT NULL, details TEXT NOT NULL DEFAULT '',
      profileImage TEXT NOT NULL DEFAULT '', rating INTEGER, status TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS slides (
      id TEXT PRIMARY KEY, image TEXT NOT NULL, alt TEXT NOT NULL, caption TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY, fileName TEXT NOT NULL, mimeType TEXT NOT NULL,
      size INTEGER NOT NULL, createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS contact (
      id INTEGER PRIMARY KEY CHECK (id = 1), companyName TEXT NOT NULL, address TEXT NOT NULL,
      phone TEXT NOT NULL, whatsapp TEXT NOT NULL, email TEXT NOT NULL, mapsUrl TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS socials (
      id TEXT PRIMARY KEY, platform TEXT NOT NULL, url TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL DEFAULT 0, updatedAt TEXT NOT NULL
    );
  `);
  seedDatabase(database);
  return database;
}

function seedDatabase(database) {
  const now = new Date().toISOString();
  const insertPost = database.prepare(`INSERT OR IGNORE INTO posts
    (id, slug, status, title, category, description, intro, sections, featuredImage, author, publishedAt, updatedAt, seoTitle, metaDescription)
    VALUES (?, ?, 'Published', ?, ?, ?, ?, ?, ?, 'OVIRA', ?, ?, ?, ?)`);
  for (const article of seedArticles) {
    const publishedAt = new Date(article.date + " UTC").toISOString();
    insertPost.run(article.id, article.id, article.title, article.category, article.description, article.intro,
      JSON.stringify(article.sections), article.featuredImage || "", publishedAt, publishedAt, article.title, article.description);
  }

  const insertMyth = database.prepare(`INSERT OR IGNORE INTO myths
    (id, myth, fact, more, status, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'Published', ?, ?, ?)`);
  const updateMyth = database.prepare("UPDATE myths SET myth=?, fact=?, more=?, position=?, updatedAt=? WHERE id=?");
  myths.forEach((item, index) => {
    const id = "myth-" + (index + 1);
    const existing = database.prepare("SELECT myth, fact, more FROM myths WHERE id=?").get(id);
    const legacy = legacyMyths[index];
    if (existing && existing.myth === legacy.myth && existing.fact === legacy.fact && existing.more === legacy.more) {
      updateMyth.run(item.myth, item.fact, item.more, index, now, id);
    } else {
      insertMyth.run(id, item.myth, item.fact, item.more, index, now, now);
    }
  });

  const insertSlide = database.prepare(`INSERT OR IGNORE INTO slides
    (id, image, alt, caption, enabled, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, ?, ?, ?)`);
  [
    ["consultation", "/assets/ivf-consultation.webp", "Fertility specialist listening to a couple during a consultation", "Care that begins by listening"],
    ["laboratory", "/assets/ivf-lab.webp", "Embryologist working carefully in a modern IVF laboratory", "Science guided by care"],
    ["guidance", "/assets/ivf-guidance.webp", "Fertility specialist reviewing personalized care options with a patient", "Your journey, your next step"],
  ].forEach(([id, image, alt, caption], index) => insertSlide.run(id, image, alt, caption, index, now, now));

  database.prepare(`INSERT OR IGNORE INTO contact (id, companyName, address, phone, whatsapp, email, mapsUrl)
    VALUES (1, ?, ?, ?, ?, ?, '')`).run(defaultContact.companyName, defaultContact.address, defaultContact.phone,
    defaultContact.whatsapp, defaultContact.email);
}

export function database() {
  if (!globalThis[databaseKey]) globalThis[databaseKey] = openDatabase();
  return globalThis[databaseKey];
}
