import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import postgres from "postgres";
import { defaultContact } from "./content.mjs";
import { legacyMyths, myths, seedArticles } from "./seed.mjs";

const databaseKey = "__oviraDatabase";
export const schema = `
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

function remoteConnectionString() {
  return (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
}

// Supabase connection strings (especially the ones added by the Vercel integration) carry
// query parameters meant for other drivers; postgres.js would forward them to the server.
function remoteClientOptions(connectionString) {
  const url = new URL(connectionString);
  for (const name of ["supa", "pgbouncer", "connection_limit", "pool_timeout"]) url.searchParams.delete(name);
  const sslmode = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  return {
    url: url.toString(),
    options: {
      ssl: sslmode === "disable" || (local && !sslmode) ? false : "require",
      prepare: false, // required by Supabase's transaction pooler (port 6543)
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
      onnotice: () => {},
    },
  };
}

function isRemoteDatabase() {
  return Boolean(remoteConnectionString());
}

export function toPostgres(sql) {
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
  return target.unsafe(toPostgres(sql), params);
}

const defaultSlides = [
  ["consultation", "/assets/ivf-consultation.webp", "Fertility specialist listening to a couple during a consultation", "Care that begins by listening"],
  ["laboratory", "/assets/ivf-lab.webp", "Embryologist working carefully in a modern IVF laboratory", "Science guided by care"],
  ["guidance", "/assets/ivf-guidance.webp", "Fertility specialist reviewing personalized care options with a patient", "Your journey, your next step"],
];

// Inserts that create the starter content. Existing rows are never overwritten.
export function seedStatements(now = new Date().toISOString()) {
  const statements = [];
  for (const article of seedArticles) {
    const publishedAt = new Date(article.date + " UTC").toISOString();
    statements.push({ sql: `INSERT OR IGNORE INTO posts
      (id, slug, status, title, category, description, intro, sections, featuredImage, author, publishedAt, updatedAt, seoTitle, metaDescription)
      VALUES (?, ?, 'Published', ?, ?, ?, ?, ?, ?, 'OVIRA', ?, ?, ?, ?)`,
    params: [article.id, article.id, article.title, article.category, article.description, article.intro,
      JSON.stringify(article.sections), article.featuredImage || "", publishedAt, publishedAt, article.title, article.description] });
  }
  for (const [index, item] of myths.entries()) {
    statements.push({ sql: `INSERT OR IGNORE INTO myths
      (id, myth, fact, more, status, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'Published', ?, ?, ?)`,
    params: ["myth-" + (index + 1), item.myth, item.fact, item.more, index, now, now] });
  }
  for (const [index, [id, image, alt, caption]] of defaultSlides.entries()) {
    statements.push({ sql: `INSERT OR IGNORE INTO slides (id, image, alt, caption, enabled, position, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?)`, params: [id, image, alt, caption, index, now, now] });
  }
  statements.push({ sql: `INSERT OR IGNORE INTO contact (id, companyName, address, phone, whatsapp, email, mapsUrl)
    VALUES (1, ?, ?, ?, ?, ?, '')`,
  params: [defaultContact.companyName, defaultContact.address, defaultContact.phone, defaultContact.whatsapp, defaultContact.email] });
  return statements;
}

async function seedRemote(client) {
  const now = new Date().toISOString();
  // Upgrade myths that still carry the original wording.
  for (const [index, item] of myths.entries()) {
    const legacy = legacyMyths[index];
    await runRemote(client, "UPDATE myths SET myth=?, fact=?, more=?, position=?, updatedAt=? WHERE id=? AND myth=? AND fact=? AND more=?",
      [item.myth, item.fact, item.more, index, now, "myth-" + (index + 1), legacy.myth, legacy.fact, legacy.more]);
  }
  for (const { sql, params } of seedStatements(now)) await runRemote(client, sql, params);
}

async function remoteInitialized(client) {
  try {
    return Boolean((await runRemote(client, "SELECT 1 AS ready FROM contact WHERE id=1"))[0]);
  } catch {
    return false;
  }
}

async function getRemoteClient() {
  if (!remoteReady) {
    remoteReady = (async () => {
      const connectionString = remoteConnectionString();
      if (!connectionString) {
        throw new Error("Configure DATABASE_URL or POSTGRES_URL for the Vercel database.");
      }
      const { url, options } = remoteClientOptions(connectionString);
      remoteClient = postgres(url, options);
      // supabase/setup.sql normally creates everything; this keeps a blank database working too.
      if (!(await remoteInitialized(remoteClient))) {
        for (const statement of schema.split(";").map(value => value.trim()).filter(Boolean)) {
          if (!statement.toUpperCase().startsWith("PRAGMA ")) await runRemote(remoteClient, statement);
        }
        await seedRemote(remoteClient);
      }
      await runRemote(remoteClient, `ALTER TABLE media ADD COLUMN IF NOT EXISTS "url" TEXT NOT NULL DEFAULT ''`);
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

function localDatabaseFile() {
  if (process.env.OVIRA_DB_PATH) return process.env.OVIRA_DB_PATH;
  // Serverless hosts (Vercel) only allow writes under /tmp. Without DATABASE_URL the site still
  // renders from seeded content there, but anything saved is temporary until Postgres is configured.
  if (process.env.VERCEL === "1") {
    console.warn("DATABASE_URL is not set; using a temporary SQLite database. Admin changes and leads will not persist.");
    return path.join("/tmp", "ovira.sqlite");
  }
  return path.join(process.cwd(), ".data", "ovira.sqlite");
}

function openLocalDatabase() {
  const file = localDatabaseFile();
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
    if (method === "all") return result.map(asRow);
    if (method === "get") return asRow(result[0]);
    return { changes: result.count };
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
      await client.begin(async transaction => {
        for (const { sql, params } of operations) await runRemote(transaction, sql, params);
      });
    },
  };
}

// False when running on Vercel without DATABASE_URL: data lives in /tmp and is lost on restart.
export function hasPersistentDatabase() {
  return isRemoteDatabase() || process.env.VERCEL !== "1";
}

export function database() {
  if (!globalThis[databaseKey]) {
    globalThis[databaseKey] = isRemoteDatabase()
      ? createAdapter()
      : createAdapter(openLocalDatabase());
  }
  return globalThis[databaseKey];
}
