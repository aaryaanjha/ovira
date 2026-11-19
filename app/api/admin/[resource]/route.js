import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { del as deleteBlob, put } from "@vercel/blob";
import { sessionName, validSession } from "../../../../lib/auth.mjs";
import { deleteFromSupabase, isSupabaseStorageUrl, supabaseStorageConfigured, uploadToSupabase } from "../../../../lib/storage.mjs";
import {
  addMedia, adminAnalytics, adminAppointments, adminLeads, adminMedia, adminMyths, adminPosts, publicContact,
  adminSlides, adminSocials, adminTestimonials, deleteMedia, deleteMyth, deletePost, deleteSlide,
  deleteSocial, deleteTestimonial, saveAppointment, saveContact, saveLead, saveMyth, savePost,
  saveSlide, saveSocial, saveTestimonial, InputError,
} from "../../../../lib/store.mjs";
import { body, failure, json, limited, rejectOrigin } from "../../../../lib/http.mjs";
import { hasPersistentDatabase } from "../../../../lib/database.mjs";

const readers = {
  analytics: adminAnalytics,
  leads: adminLeads,
  appointments: adminAppointments,
  blogs: adminPosts,
  posts: adminPosts,
  myths: adminMyths,
  testimonials: adminTestimonials,
  banners: adminSlides,
  media: adminMedia,
  contact: publicContact,
  socials: adminSocials,
};

const writers = {
  leads: saveLead,
  appointments: saveAppointment,
  blogs: savePost,
  posts: savePost,
  myths: saveMyth,
  testimonials: saveTestimonial,
  banners: saveSlide,
  contact: saveContact,
  socials: saveSocial,
};

const deleters = {
  blogs: deletePost,
  posts: deletePost,
  myths: deleteMyth,
  testimonials: deleteTestimonial,
  banners: deleteSlide,
  socials: deleteSocial,
};

function imageMime(bytes) {
  if (bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return "";
}

async function uploadImage(request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength && contentLength > 5 * 1024 * 1024 + 128 * 1024) throw new InputError("Image files must be no larger than 5 MB.");
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") throw new InputError("Choose an image file to upload.");
  if (file.size < 1 || file.size > 5 * 1024 * 1024) throw new InputError("Image files must be no larger than 5 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = imageMime(bytes);
  if (!mimeType) throw new InputError("Upload a valid JPG, PNG, or WebP image.");
  const id = randomUUID();
  const fileName = path.basename(file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 140) || "image";
  if (supabaseStorageConfigured()) {
    const url = await uploadToSupabase(id, fileName, bytes, mimeType);
    try {
      const media = await addMedia({ id, fileName, mimeType, size: bytes.length, url });
      return json({ data: { ...media, url: "/media/" + media.id } }, 201);
    } catch (error) {
      await deleteFromSupabase(url).catch(() => {});
      throw error;
    }
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(fileName, bytes, { access: "public", contentType: mimeType, addRandomSuffix: true });
    try {
      const media = await addMedia({ id, fileName, mimeType, size: bytes.length, url: blob.url });
      return json({ data: { ...media, url: "/media/" + media.id } }, 201);
    } catch (error) {
      await deleteBlob(blob.url);
      throw error;
    }
  }
  if (process.env.VERCEL === "1") throw new InputError("Image uploads need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  const media = await addMedia({ id, fileName, mimeType, size: bytes.length });
  const directory = path.join(process.cwd(), ".data", "media");
  const destination = path.join(directory, media.id);
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(destination, bytes, { flag: "wx" });
  } catch (error) {
    await unlink(destination).catch(cleanupError => {
      if (cleanupError.code !== "ENOENT") throw cleanupError;
    });
    await deleteMedia(media.id);
    throw error;
  }
  return json({ data: { ...media, url: "/media/" + media.id } }, 201);
}

async function handle(request, context) {
  if (!validSession(request.cookies.get(sessionName)?.value)) return json({ error: "Sign in to continue." }, 401);
  const method = request.method;
  const write = method !== "GET";
  if (write && rejectOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  if (write && limited(request, "admin-writes", 120, 60000)) return json({ error: "Too many changes. Wait a minute and try again." }, 429);
  if (write && !hasPersistentDatabase()) {
    return json({ error: "Saving is disabled until DATABASE_URL is set in Vercel to your Supabase connection string." }, 503);
  }

  const { resource } = await context.params;
  if (!Object.hasOwn(readers, resource)) return json({ error: "Not found." }, 404);
  try {
    if (method === "GET") return json({ data: await readers[resource]() });
    if (resource === "media" && method === "POST") return await uploadImage(request);
    if (method === "POST" || method === "PATCH") {
      const data = await body(request);
      if (resource === "leads" && method === "POST") return json({ error: "Leads are created from the public appointment form." }, 405);
      if (resource === "appointments" && method === "POST") return json({ error: "Appointments are created from the public appointment form." }, 405);
      const save = writers[resource];
      if (!save) return json({ error: "This item cannot be changed." }, 405);
      return json({ data: await save(data) });
    }
    if (method === "DELETE") {
      const data = await body(request, 2000);
      if (resource === "media") {
        const media = await deleteMedia(data.id);
        if (media.url && isSupabaseStorageUrl(media.url)) await deleteFromSupabase(media.url);
        else if (media.url) await deleteBlob(media.url);
        else await unlink(path.join(process.cwd(), ".data", "media", media.id)).catch(error => {
          if (error.code !== "ENOENT") throw error;
        });
        return json({ data: true });
      }
      const remove = deleters[resource];
      if (!remove) return json({ error: "This item cannot be deleted." }, 405);
      await remove(data.id);
      return json({ data: true });
    }
    return json({ error: "Method not allowed." }, 405);
  } catch (error) {
    return failure(error, "The change could not be saved. Please try again.");
  }
}

export function GET(request, context) { return handle(request, context); }
export function POST(request, context) { return handle(request, context); }
export function PATCH(request, context) { return handle(request, context); }
export function DELETE(request, context) { return handle(request, context); }
