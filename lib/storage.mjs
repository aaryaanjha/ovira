// Image storage in a public Supabase Storage bucket (created by supabase/setup.sql).
// Uses the Storage REST API with the service role key, which must stay server-side.

const supabaseUrl = () => (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
const serviceKey = () => (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
export const storageBucket = () => (process.env.SUPABASE_STORAGE_BUCKET || "ovira-media").trim();

export function supabaseStorageConfigured() {
  return Boolean(supabaseUrl() && serviceKey());
}

function headers(extra = {}) {
  return { apikey: serviceKey(), Authorization: "Bearer " + serviceKey(), ...extra };
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
