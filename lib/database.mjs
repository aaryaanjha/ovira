import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { neon } from "@neondatabase/serverless";
import { defaultContact } from "./content.mjs";
import { legacyMyths, myths, seedArticles } from "./seed.mjs";

const databaseKey = "__oviraDatabase";
const schema = `
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
    size INTEGER NOT NULL, createdAt TEXT NOT NULL, url TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS contact (
    id INTEGER PRIMARY KEY CHECK (id = 1), companyName TEXT NOT NULL, address TEXT NOT NULL,
    phone TEXT NOT NULL, whatsapp TEXT NOT NULL, email TEXT NOT NULL, mapsUrl TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS socials (
    id TEXT PRIMARY KEY, platform TEXT NOT NULL, url TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL DEFAULT 0, updatedAt TEXT NOT NULL
  );
`;

let remoteClient;
let remoteReady;

function isRemoteDatabase() {
  return process.env.VERCEL === "1" || Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

function toPostgres(sql) {
  const ignoreConflicts = /^\s*INSERT OR IGNORE INTO\b/i.test(sql);
  let index = 0;
  let query = sql
    .replace(/^\s*INSERT OR IGNORE INTO\b/i, "INSERT INTO")
    .replace(/\b[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*\b/g, identifier => `"${identifier}"`)
    .replace(/\?/g, () => "$" + (++index));
  if (ignoreConflicts) query += " ON CONFLICT DO NOTHING";
  return query;
}

function asRow(row) {
  if (!row) return row;
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key, key === "count" && value !== null ? Number(value) : value,
  ]));
}

async function runRemote(target, sql, params = []) {
  return target.query(toPostgres(sql), params);
}

async function seedRemote(pool) {
  const now = new Date().toISOString();
  for (const article of seedArticles) {
    const publishedAt = new Date(article.date + " UTC").toISOString();
    await runRemote(pool, `INSERT OR IGNORE INTO posts
      (id, slug, status, title, category, description, intro, sections, featuredImage, author, publishedAt, updatedAt, seoTitle, metaDescription)
      VALUES (?, ?, 'Published', ?, ?, ?, ?, ?, ?, 'OVIRA', ?, ?, ?, ?)`,
    [article.id, article.id, article.title, article.category, article.description, article.intro,
      JSON.stringify(article.sections), article.featuredImage || "", publishedAt, publishedAt, article.title, article.description]);
  }

  for (const [index, item] of myths.entries()) {
    const id = "myth-" + (index + 1);
    const existing = (await runRemote(pool, "SELECT myth, fact, more FROM myths WHERE id=?", [id])).rows[0];
    if (existing && existing.myth === legacyMyths[index].myth && existing.fact === legacyMyths[index].fact &&
      existing.more === legacyMyths[index].more) {
      await runRemote(pool, "UPDATE myths SET myth=?, fact=?, more=?, position=?, updatedAt=? WHERE id=?",
        [item.myth, item.fact, item.more, index, now, id]);
    } else {
      await runRemote(pool, `INSERT OR IGNORE INTO myths
        (id, myth, fact, more, status, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'Published', ?, ?, ?)`,
      [id, item.myth, item.fact, item.more, index, now, now]);
    }
  }

  const slides = [
    ["consultation", "/assets/ivf-consultation.webp", "Fertility specialist listening to a couple during a consultation", "Care that begins by listening"],
    ["laboratory", "/assets/ivf-lab.webp", "Embryologist working carefully in a modern IVF laboratory", "Science guided by care"],
    ["guidance", "/assets/ivf-guidance.webp", "Fertility specialist reviewing personalized care options with a patient", "Your journey, your next step"],
  ];
  for (const [index, [id, image, alt, caption]] of slides.entries()) {
    await runRemote(pool, `INSERT OR IGNORE INTO slides (id, image, alt, caption, enabled, position, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?)`, [id, image, alt, caption, index, now, now]);
  }
  await runRemote(pool, `INSERT OR IGNORE INTO contact (id, companyName, address, phone, whatsapp, email, mapsUrl)
    VALUES (1, ?, ?, ?, ?, ?, '')`,
  [defaultContact.companyName, defaultContact.address, defaultContact.phone, defaultContact.whatsapp, defaultContact.email]);
}

async function getRemoteClient() {
  if (!remoteReady) {
    remoteReady = (async () => {
      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (!connectionString) {
        throw new Error("Configure DATABASE_URL or POSTGRES_URL for the Vercel database.");
      }
      remoteClient = neon(connectionString, { fullResults: true });
      for (const statement of schema.split(";").map(value => value.trim()).filter(Boolean)) {
        if (!statement.toUpperCase().startsWith("PRAGMA ")) await runRemote(remoteClient, statement);
      }
      await runRemote(remoteClient, `ALTER TABLE media ADD COLUMN IF NOT EXISTS "url" TEXT NOT NULL DEFAULT ''`);
      await seedRemote(remoteClient);
      return remoteClient;
    })();
    remoteReady.catch(() => { remoteReady = undefined; remoteClient = undefined; });
  }
  return remoteReady;
}

function seedLocal(database) {
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

function openLocalDatabase() {
  const file = process.env.OVIRA_DB_PATH || path.join(process.cwd(), ".data", "ovira.sqlite");
  mkdirSync(path.dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec(schema);
  if (!database.prepare("PRAGMA table_info(media)").all().some(column => column.name === "url")) {
    database.exec("ALTER TABLE media ADD COLUMN url TEXT NOT NULL DEFAULT ''");
  }
  seedLocal(database);
  return database;
}

function createAdapter(local = null, remote = null) {
  const execute = async (method, sql, params) => {
    if (local) return local.prepare(sql)[method](...params);
    const target = remote || await getRemoteClient();
    const result = await runRemote(target, sql, params);
    if (method === "all") return result.rows.map(asRow);
    if (method === "get") return asRow(result.rows[0]);
    return { changes: result.rowCount };
  };
  return {
    prepare(sql) {
      return {
        all: (...params) => execute("all", sql, params),
        get: (...params) => execute("get", sql, params),
        run: (...params) => execute("run", sql, params),
      };
    },
    async transaction(operations) {
      if (local) {
        local.exec("BEGIN IMMEDIATE");
        try {
          for (const { sql, params } of operations) await execute("run", sql, params);
          local.exec("COMMIT");
          return;
        } catch (error) {
          local.exec("ROLLBACK");
          throw error;
        }
      }
      const client = remote || await getRemoteClient();
      const queries = operations.map(({ sql, params }) => client.query(toPostgres(sql), params));
      return client.transaction(queries);
    },
  };
}

export function database() {
  if (!globalThis[databaseKey]) {
    globalThis[databaseKey] = isRemoteDatabase()
      ? createAdapter()
      : createAdapter(openLocalDatabase());
  }
  return globalThis[databaseKey];
}
