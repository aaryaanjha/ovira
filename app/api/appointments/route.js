import { body, failure, json, limited, rejectOrigin } from "../../../lib/http.mjs";
import { newLead } from "../../../lib/store.mjs";

export async function POST(request) {
  if (rejectOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  if (limited(request, "appointments", process.env.TRUSTED_CLIENT_IP_HEADER ? 8 : 60, 60000)) {
    return json({ error: "Please wait a minute and try again." }, 429);
  }
  try {
    await newLead(await body(request, 8000));
    return json({ ok: true }, 201);
  } catch (error) {
    return failure(error, "We could not save your appointment request. Please try again or contact our team directly.");
  }
}
