import { sign } from "node:crypto";

const tokenUrl = "https://oauth2.googleapis.com/token";
const scope = "https://www.googleapis.com/auth/spreadsheets";
const encoded = value => Buffer.from(JSON.stringify(value)).toString("base64url");
let tokenPromise;

export function sheetsConfigured() {
  return Boolean(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

async function issueToken() {
  const now = Math.floor(Date.now() / 1000);
  const assertion = encoded({ alg: "RS256", typ: "JWT" }) + "." + encoded({
    iss: process.env.GOOGLE_CLIENT_EMAIL, scope, aud: tokenUrl, iat: now, exp: now + 3600,
  });
  const signature = sign("RSA-SHA256", Buffer.from(assertion), process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"));
  const response = await fetch(tokenUrl, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: assertion + "." + signature.toString("base64url"),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Google authentication failed (" + response.status + ").");
  const token = await response.json();
  return { value: token.access_token, expires: Date.now() + (token.expires_in - 60) * 1000 };
}

async function accessToken() {
  if (tokenPromise && (await tokenPromise).expires <= Date.now()) tokenPromise = undefined;
  tokenPromise ??= issueToken().catch(error => { tokenPromise = undefined; throw error; });
  return (await tokenPromise).value;
}

export async function google(path = "", method = "GET", data) {
  if (!sheetsConfigured()) throw new Error("Google Sheets connection is not configured.");
  const base = "https://sheets.googleapis.com/v4/spreadsheets/" + encodeURIComponent(process.env.GOOGLE_SHEET_ID);
  const response = await fetch(base + path, {
    method,
    headers: { Authorization: "Bearer " + await accessToken(), "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    if (response.status === 401) tokenPromise = undefined;
    throw new Error("Google Sheets request failed (" + response.status + ").");
  }
  return response.json();
}

export const columns = {
  Leads: ["id", "createdAt", "name", "phone", "email", "address", "contact", "message", "consent", "status", "notes", "updatedAt"],
  Posts: ["id", "status", "title", "category", "description", "intro", "sections", "publishedAt", "updatedAt"],
  Settings: ["phone", "whatsapp", "email"],
};

function valuesPath(tab, first = 1, last = "") {
  return "/values/" + encodeURIComponent(tab + "!A" + first + ":" + String.fromCharCode(64 + columns[tab].length) + last);
}

export async function rows(tab) {
  const { values = [] } = await google(valuesPath(tab));
  const fields = columns[tab];
  if (!fields.every((field, i) => values[0]?.[i] === field)) throw new Error("Unexpected header row in " + tab + ".");
  return values.slice(1).flatMap((cells, i) => cells[0] ? [{
    row: i + 2,
    ...Object.fromEntries(fields.map((field, column) => [field, String(cells[column] ?? "")])),
  }] : []);
}

export function append(tab, data) {
  return google(valuesPath(tab) + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS", "POST", {
    values: [columns[tab].map(field => data[field] ?? "")],
  });
}

export function replaceRow(tab, row, data) {
  return google(valuesPath(tab, row, row) + "?valueInputOption=RAW", "PUT", {
    values: [columns[tab].map(field => data[field] ?? "")],
  });
}

export async function updateLeadFields(row, values) {
  await google("/values/" + encodeURIComponent("Leads!J" + row + ":L" + row) + "?valueInputOption=RAW", "PUT", { values: [values] });
}
