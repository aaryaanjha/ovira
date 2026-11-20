// Image storage in a public Supabase Storage bucket (created by supabase/setup.sql).
// Uses the Storage REST API with the service role key, which must stay server-side.

const env = name => (process.env[name] || "").trim().replace(/^["']|["']$/g, "").trim();
const supabaseUrl = () => (env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL")).replace(/\/+$/, "");
const serviceKey = () => env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SECRET_KEY");
export const storageBucket = () => env("SUPABASE_STORAGE_BUCKET") || "ovira-media";

export function supabaseStorageConfigured() {
  return Boolean(supabaseUrl() && serviceKey());
}

// Legacy service_role keys are JWTs and go in both headers. The newer sb_secret_... keys are
// not JWTs: Supabase expects them in the apikey header only and authorises the request from it.
function headers(extra = {}) {
  const key = serviceKey();
  return key.startsWith("sb_") ? { apikey: key, ...extra } : { apikey: key, Authorization: "Bearer " + key, ...extra };
}

const objectPath = url => {
  const prefix = supabaseUrl() + "/storage/v1/object/public/" + encodeURIComponent(storageBucket()) + "/";
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : "";
};

export async function uploadToSupabase(id, fileName, bytes, mimeType) {
  const name = id + "/" + fileName;
  const encoded = name.split("/").map(encodeURIComponent).join("/");
  const bucket = encodeURIComponent(storageBucket());
  const response = await fetch(supabaseUrl() + "/storage/v1/object/" + bucket + "/" + encoded, {
    method: "POST",
    headers: headers({ "Content-Type": mimeType, "Cache-Control": "31536000", "x-upsert": "false" }),
    body: bytes,
  });
  if (!response.ok) throw new Error("Supabase Storage upload failed (" + response.status + "). Check the bucket and service role key.");
  return supabaseUrl() + "/storage/v1/object/public/" + bucket + "/" + encoded;
}

export async function deleteFromSupabase(url) {
  const name = objectPath(url);
  if (!name) return;
  const response = await fetch(supabaseUrl() + "/storage/v1/object/" + encodeURIComponent(storageBucket()), {
    method: "DELETE",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ prefixes: [name] }),
  });
  if (!response.ok && response.status !== 404) throw new Error("Supabase Storage delete failed (" + response.status + ").");
}

export function isSupabaseStorageUrl(url) {
  return Boolean(supabaseUrl()) && Boolean(objectPath(url));
}

// Used by the admin setup check: confirms the key works and the bucket exists and is public.
export async function checkStorage() {
  if (!supabaseStorageConfigured()) {
    return process.env.VERCEL === "1"
      ? { ok: false, title: "Image uploads are not configured", fix: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the secret key) in Vercel, then redeploy.", detail: "" }
      : { ok: true, title: "Local image folder", fix: "", detail: "" };
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl()) && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(supabaseUrl())) {
    return { ok: false, title: "SUPABASE_URL looks wrong", fix: "Use the Project URL from Supabase > Project Settings > API, for example https://abcdefgh.supabase.co", detail: "" };
  }
  try {
    const response = await fetch(supabaseUrl() + "/storage/v1/bucket/" + encodeURIComponent(storageBucket()), { headers: headers(), cache: "no-store" });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, title: "Supabase rejected the secret key", fix: "Set SUPABASE_SERVICE_ROLE_KEY to the secret (service_role) key, not the publishable/anon key.", detail: "HTTP " + response.status };
    }
    if (response.status === 404 || response.status === 400) {
      return { ok: false, title: "Image bucket \"" + storageBucket() + "\" does not exist", fix: "Run supabase/setup.sql in the Supabase SQL Editor, or create a public bucket with this name under Storage.", detail: "HTTP " + response.status };
    }
    if (!response.ok) return { ok: false, title: "Supabase Storage returned an error", fix: "Check the Supabase project status.", detail: "HTTP " + response.status };
    const bucket = await response.json();
    if (!bucket.public) return { ok: false, title: "Image bucket is private", fix: "In Supabase > Storage, edit the bucket and turn on Public bucket.", detail: "" };
    return { ok: true, title: "Image storage ready", fix: "", detail: "Bucket " + storageBucket() };
  } catch (error) {
    return { ok: false, title: "Supabase Storage cannot be reached", fix: "Check SUPABASE_URL.", detail: String(error?.cause?.code || error?.message || "").slice(0, 120) };
  }
}
