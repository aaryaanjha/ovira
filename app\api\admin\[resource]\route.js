import { validSession, sessionName } from "../../../../lib/auth.mjs";
import { body, failure, json, rejectOrigin } from "../../../../lib/http.mjs";
import { sheetsConfigured } from "../../../../lib/sheets.mjs";
import { adminLeads, adminPosts, publicContact, saveContact, saveLead, savePost } from "../../../../lib/store.mjs";

const readers = { leads: adminLeads, posts: adminPosts, contact: publicContact };
const writers = { leads: saveLead, posts: savePost, contact: saveContact };

async function handle(request, context, write) {
  if (!validSession(request.cookies.get(sessionName)?.value)) return json({ error: "Sign in to continue." }, 401);
  if (write && rejectOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  if (!sheetsConfigured()) return json({ error: "Connect the Google Sheet and run the setup command." }, 503);
  const { resource } = await context.params;
  const actions = write ? writers : readers;
  if (!Object.hasOwn(actions, resource)) return json({ error: "Not found." }, 404);
  try {
    const data = write ? await actions[resource](await body(request)) : await actions[resource]();
    return json({ data: data ?? null });
  } catch (error) {
    return failure(error, "Google Sheets is unavailable. Check the connection and try again.");
  }
}

export function GET(request, context) { return handle(request, context, false); }
export function PATCH(request, context) { return handle(request, context, true); }
