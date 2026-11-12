import { NextResponse } from "next/server";
import { InputError } from "./store.mjs";

export function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function rejectOrigin(request) {
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  const expected = process.env.APP_ORIGIN || url.protocol + "//" + host;
  return request.headers.get("origin") !== expected;
}

export async function body(request, limit = 64000) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new InputError("Send a JSON request.");
  if (Number(request.headers.get("content-length")) > limit) throw new InputError("The request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new InputError("The request is empty.");
  const chunks = [];
  let bytes = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit) {
      await reader.cancel();
      throw new InputError("The request is too large.");
    }
    chunks.push(Buffer.from(value));
  }
  let result;
  try { result = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new InputError("The request is invalid."); }
  if (!result || Array.isArray(result) || typeof result !== "object") throw new InputError("The request is invalid.");
  return result;
}

export function failure(error, fallback) {
  if (error instanceof InputError) return json({ error: error.message }, 400);
  console.error(error.message);
  return json({ error: fallback }, 503);
}

// Per-instance throttle. Use a trusted proxy or host-level limits across multiple instances.
const limits = new Map();
export function limited(request, group, maximum, interval) {
  const proxyHeader = process.env.TRUSTED_CLIENT_IP_HEADER;
  const ip = proxyHeader ? request.headers.get(proxyHeader)?.split(",")[0].trim() : "";
  const key = group + ":" + (ip || "shared");
  const now = Date.now();
  if (limits.size >= 1000) {
    for (const [entry, state] of limits) if (state.until <= now) limits.delete(entry);
    if (limits.size >= 1000 && !limits.has(key)) return true;
  }
  const state = limits.get(key);
  if (!state || state.until <= now) {
    limits.set(key, { count: 1, until: now + interval });
    return false;
  }
  return ++state.count > maximum;
}
