import { createHmac, scrypt as deriveKey, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(deriveKey);
export const sessionName = "ovira_admin";
export const sessionLifetime = 8 * 60 * 60;

// Values pasted into a hosting dashboard often pick up spaces, line breaks or surrounding quotes.
const env = name => (process.env[name] || "").trim().replace(/^(["'])(.*)\1$/s, "$2").trim();
const adminUsername = () => env("ADMIN_USERNAME") || env("ADMIN_EMAIL");
const passwordHash = () => env("ADMIN_PASSWORD_HASH");
const sessionSecret = () => env("ADMIN_SESSION_SECRET");
export const currentUsername = () => adminUsername();

// Names (never values) of admin settings that are missing or malformed.
export function authSetupProblems() {
  const problems = [];
  if (!adminUsername()) problems.push("ADMIN_USERNAME is not set");
  if (!passwordHash()) problems.push("ADMIN_PASSWORD_HASH is not set");
  else if (!/^[0-9a-f]{32}:[0-9a-f]{128}$/i.test(passwordHash())) problems.push("ADMIN_PASSWORD_HASH is not a hash from npm run admin:password");
  if (!sessionSecret()) problems.push("ADMIN_SESSION_SECRET is not set");
  else if (sessionSecret().length < 32) problems.push("ADMIN_SESSION_SECRET must be at least 32 characters");
  return problems;
}

export function authConfigured() {
  return authSetupProblems().length === 0;
}

function hmac(value) {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

export async function credentialsMatch(username, password) {
  if (!authConfigured() || typeof username !== "string" || typeof password !== "string" ||
    username.length > 64 || password.length > 250) return false;
  const [salt, hash] = passwordHash().split(":");
  const actual = await scrypt(password, Buffer.from(salt, "hex"), 64);
  return timingSafeEqual(Buffer.from(hash, "hex"), actual) && username.trim().toLowerCase() === adminUsername().toLowerCase();
}

function sessionVersion() {
  return hmac(adminUsername() + ":" + passwordHash()).slice(0, 24);
}

export function createSession() {
  const expiry = String(Math.floor(Date.now() / 1000) + sessionLifetime);
  const data = expiry + "." + sessionVersion();
  return data + "." + hmac(data);
}

export function validSession(token = "") {
  if (!authConfigured() || !/^\d{10}\.[a-f0-9]{24}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expires, version, signature] = token.split(".");
  if (+expires <= Date.now() / 1000 || version !== sessionVersion()) return false;
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(hmac(expires + "." + version), "hex"));
}
