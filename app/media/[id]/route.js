import { readFile } from "node:fs/promises";
import path from "node:path";
import { findMedia } from "../../../lib/store.mjs";

export const runtime = "nodejs";

export async function GET(request, context) {
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return new Response("Not found", { status: 404 });
  const media = await findMedia(id);
  if (!media || !["image/jpeg", "image/png", "image/webp"].includes(media.mimeType)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(process.cwd(), ".data", "media", media.id));
    return new Response(bytes, { headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(media.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error.code === "ENOENT") return new Response("Not found", { status: 404 });
    throw error;
  }
}
