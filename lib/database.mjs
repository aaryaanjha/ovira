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

const safeDecode = value => {
  try { return decodeURIComponent(value); } catch { return value; }
};

// Parse DATABASE_URL by hand instead of with new URL(): Supabase database passwords often
// contain characters such as @ # / ? that break URL parsing unless they are percent-encoded.
// Driver-specific query parameters added by Supabase/Vercel (supa, pgbouncer...) are dropped.
export function parseConnectionString(connectionString) {
  const match = connectionString.match(/^postgres(?:ql)?:\/\/(.+)$/i);
  if (!match) throw new DatabaseConfigError("DATABASE_URL must start with postgresql://");
  const rest = match[1];
  const at = rest.lastIndexOf("@");
  if (at < 1) throw new DatabaseConfigError("DATABASE_URL is missing the user name and password.");
  const userInfo = rest.slice(0, at);
  const location = rest.slice(at + 1);
  const colon = userInfo.indexOf(":");
  const username = safeDecode(colon === -1 ? userInfo : userInfo.slice(0, colon));
  const password = colon === -1 ? "" : safeDecode(userInfo.slice(colon + 1));
  const hostMatch = location.match(/^(\[[^\]]+\]|[^:/?]+)(?::(\d+))?(?:\/([^?]*))?(?:\?(.*))?$/);
  if (!hostMatch) throw new DatabaseConfigError("DATABASE_URL has an invalid host part.");
  const [, host, port, database, query = ""] = hostMatch;
  if (/\[YOUR-PASSWORD\]|FILL-ME/i.test(connectionString) || !password) {
    throw new DatabaseConfigError("DATABASE_URL still contains a placeholder instead of the database password.");
  }
  const sslmode = new URLSearchParams(query).get("sslmode");
  return { username, password, host: host.replace(/^\[|\]$/g, ""), port: Number(port || 5432), database: safeDecode(database || "postgres"), sslmode };
}

export class DatabaseConfigError extends Error {}

function remoteClientOptions(connectionString) {
  const { username, password, host, port, database, sslmode } = parseConnectionString(connectionString);
  const local = ["localhost", "127.0.0.1", "::1"].includes(host);
  return {
    host, port, database, username, password,
    ssl: sslmode === "disable" || (local && !sslmode) ? false : "require",
    prepare: false, // required by Supabase's transaction pooler (port 6543)
    max: 5,
    idle_timeout: 20,
    // Give up quickly: a visitor should never wait on a slow or blocked database.
    connect_timeout: 5,
    onnotice: () => {},
  };
}

// Turns a connection error into a safe, actionable explanation (never includes the password).
export function describeDatabaseError(error) {
  const code = error?.code || "";
  const message = String(error?.message || error || "").replace(/postgres(?:ql)?:\/\/\S+/gi, "[connection string]");
  const help = (title, fix) => ({ ok: false, title, fix, detail: (code ? code + ": " : "") + message.slice(0, 300) });
  if (error instanceof DatabaseConfigError) return help("DATABASE_URL is not filled in correctly", message);
  if (code === "28P01" || /password authentication failed/i.test(message)) {
    return help("Wrong database password", "In Supabase > Project Settings > Database click Reset database password and choose one with only letters and numbers. Then copy the Transaction pooler string from Supabase > Connect, replace [YOUR-PASSWORD] (including the brackets) with the new password, paste it as DATABASE_URL in Vercel and redeploy.");
  }
  if (/tenant or user not found/i.test(message)) {
    return help("Supabase does not recognise this connection string", "Copy DATABASE_URL again from Supabase > Connect > Transaction pooler. The user name must look like postgres.<project-ref>.");
  }
  if (["ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH"].includes(code)) {
    return help("Database host cannot be reached from Vercel", "Use the Transaction pooler connection string (host ends in pooler.supabase.com, port 6543). The Direct connection host (db.<ref>.supabase.co) only works over IPv6, which Vercel does not support.");
  }
  if (code === "ECONNREFUSED") {
    return help("Database refused the connection", "Check the host and port in DATABASE_URL. For Supabase use the Transaction pooler string (port 6543).");
  }
  if (["ETIMEDOUT", "ECONNRESET", "CONNECT_TIMEOUT"].includes(code) || /timeout/i.test(message)) {
    return help("Connection to the database timed out", "Check that the Supabase project is not paused and that DATABASE_URL uses the Transaction pooler on port 6543.");
  }
  if (code === "42P01" || /relation .* does not exist/i.test(message)) {
    return help("Database tables are missing", "Run supabase/setup.sql in the Supabase SQL Editor.");
  }
  if (code === "3D000") return help("Database name is wrong", "The connection string should end with /postgres.");
  return help("Database error", "Check DATABASE_URL in Vercel and the Vercel function logs for details.");
}

// Used by the admin setup check. Runs a trivial query and reports the outcome.
export async function checkDatabase() {
  if (!isRemoteDatabase()) {
    return process.env.VERCEL === "1"
      ? { ok: false, title: "DATABASE_URL is not set", fix: "Add DATABASE_URL in Vercel > Settings > Environment Variables, then redeploy.", detail: "" }
      : { ok: true, title: "Local SQLite database", fix: "", detail: "" };
  }
  try {
    const client = await getRemoteClient();
    const [row] = await runRemote(client, "SELECT (SELECT COUNT(*) FROM posts) AS count");
    return { ok: true, title: "Connected to Supabase", fix: "", detail: Number(row.count) + " articles stored" };
  } catch (error) {
    const result = describeDatabaseError(error);
    const hints = connectionHints();
    return hints ? { ...result, detail: [result.detail, hints].filter(Boolean).join(" | ") } : result;
  }
}

// Safe facts about DATABASE_URL (connection type, user name, password shape - never the password)
// that explain the most common copy-paste mistakes.
function connectionHints() {
  let parsed;
  try { parsed = parseConnectionString(remoteConnectionString()); } catch { return ""; }
  const { host, port, username, password } = parsed;
  const type = /pooler\.supabase\.com$/i.test(host)
    ? (port === 6543 ? "Transaction pooler" : "Session pooler")
    : /^db\.[a-z0-9]+\.supabase\.co$/i.test(host) ? "Direct connection" : "Custom host";
  const hints = ["Using: " + type + ", port " + port + ", user " + username];
  if (/^\[.*\]$/.test(password)) hints.push("The password is still wrapped in [ ] - remove the square brackets");
  if (/\s/.test(password)) hints.push("The password contains spaces - check for a stray space or line break");
  if (/^(["']).*\1$/.test(password)) hints.push("The password is wrapped in quotes - remove them");
  if (type === "Transaction pooler" && !username.includes(".")) hints.push("Pooler user names look like postgres.<project-ref>");
  return hints.join(" | ");
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
  } catch (error) {
    // Only a missing table means "not set up yet". Connection and password errors are passed on,
    // so a bad password is not retried a second time (Supabase blocks logins after repeated failures).
    if (error?.code === "42P01") return false;
    throw error;
  }
}

async function getRemoteClient() {
  if (!remoteReady) {
    remoteReady = (async () => {
      const connectionString = remoteConnectionString();
      if (!connectionString) {
        throw new Error("Configure DATABASE_URL or POSTGRES_URL for the Vercel database.");
      }
      remoteClient = postgres(remoteClientOptions(connectionString));
      // supabase/setup.sql normally creates everything; this keeps a blank database working too.
      if (!(await remoteInitialized(remoteClient))) {
        for (const statement of schema.split(";").map(value => value.trim()).filter(Boolean)) {
          if (!statement.toUpperCase().startsWith("PRAGMA ")) await runRemote(remoteClient, statement);
        }
        await seedRemote(remoteClient);
      }
      // ALTER TABLE takes an exclusive lock even when the column already exists, so only run it
      // when the column is really missing. Running it on every cold start could stall page loads.
      const [mediaUrl] = await runRemote(remoteClient, `SELECT 1 AS present FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'media' AND column_name = 'url'`);
      if (!mediaUrl) await runRemote(remoteClient, `ALTER TABLE media ADD COLUMN IF NOT EXISTS "url" TEXT NOT NULL DEFAULT ''`);
      return remoteClient;
    })();
    remoteReady.catch(() => resetRemoteClient());
  }
  return withTimeout(remoteReady, remoteQueryTimeout, "Connecting to the database");
}

// Drops the shared client so the next request opens fresh connections instead of queueing
// behind a connection that has stopped responding.
export function resetRemoteClient() {
  remoteClient?.end({ timeout: 1 }).catch(() => {});
  remoteReady = undefined;
  remoteClient = undefined;
}

const remoteQueryTimeout = 8000;

export class DatabaseTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.code = "CONNECT_TIMEOUT";
  }
}

// postgres.js has no overall query time limit, and a busy or blocked pooler can leave a query
// waiting forever. Every remote call is capped so a request can never hang on the database.
export function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new DatabaseTimeoutError(label + " timed out after " + ms + " ms")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
    const query = runRemote(target, sql, params);
    let result;
    try {
      result = await withTimeout(query, remoteQueryTimeout, "Database query");
    } catch (error) {
      if (error instanceof DatabaseTimeoutError) {
        query.cancel?.();
        resetRemoteClient();
      }
      throw error;
    }
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
      await withTimeout(client.begin(async transaction => {
        for (const { sql, params } of operations) await runRemote(transaction, sql, params);
      }), remoteQueryTimeout, "Database transaction");
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
