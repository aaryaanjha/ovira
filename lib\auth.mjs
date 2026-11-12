import { createHmac, scrypt as deriveKey, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(deriveKey);
export const sessionName = "ovira_admin";
export const sessionLifetime = 8 * 60 * 60;

export function authConfigured() {
  return Boolean(process.env.ADMIN_EMAIL?.trim()) && /^[0-9a-f]{32}:[0-9a-f]{128}$/i.test(process.env.ADMIN_PASSWORD_HASH || "") &&
    (process.env.ADMIN_SESSION_SECRET || "").length >= 32;
}

function hmac(value) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(value).digest("hex");
}

export async function credentialsMatch(email, password) {
  if (!authConfigured() || typeof email !== "string" || typeof password !== "string" || password.length > 250) return false;
  const [salt, hash] = process.env.ADMIN_PASSWORD_HASH.split(":");
  const actual = await scrypt(password, Buffer.from(salt, "hex"), 64);
  return timingSafeEqual(Buffer.from(hash, "hex"), actual) && email.trim().toLowerCase() === process.env.ADMIN_EMAIL.trim().toLowerCase();
}

function sessionVersion() {
  return hmac(process.env.ADMIN_EMAIL + ":" + process.env.ADMIN_PASSWORD_HASH).slice(0, 24);
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
