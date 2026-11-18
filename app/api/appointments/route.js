import { body, failure, json, limited, rejectOrigin } from "../../../lib/http.mjs";
import { newLead, publicContact } from "../../../lib/store.mjs";
import { hasPersistentDatabase } from "../../../lib/database.mjs";
import { contactLinks } from "../../../lib/content.mjs";

export async function POST(request) {
  if (rejectOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  if (limited(request, "appointments", process.env.TRUSTED_CLIENT_IP_HEADER ? 8 : 60, 60000)) {
    return json({ error: "Please wait a minute and try again." }, 429);
  }
  try {
    await newLead(await body(request, 8000));
    if (hasPersistentDatabase()) return json({ ok: true }, 201);
    // No database configured: ask the visitor to send the request to the clinic on WhatsApp so it is not lost.
    return json({ ok: true, whatsapp: contactLinks(await publicContact()).whatsapp }, 201);
  } catch (error) {
    return failure(error, "We could not save your appointment request. Please try again or contact our team directly.");
  }
}
