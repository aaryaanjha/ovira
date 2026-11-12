import { authConfigured, createSession, credentialsMatch, sessionLifetime, sessionName } from "../../../../lib/auth.mjs";
import { body, failure, json, limited, rejectOrigin } from "../../../../lib/http.mjs";

const cookie = () => ({ httpOnly: true, sameSite: "strict", secure: (process.env.APP_ORIGIN || "").startsWith("https://"), path: "/" });

export async function POST(request) {
  if (rejectOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  if (!authConfigured()) return json({ error: "Staff sign-in has not been configured." }, 503);
  if (limited(request, "admin", 8, 15 * 60000)) return json({ error: "Too many sign-in attempts. Try again in 15 minutes." }, 429);
  try {
    const { email, password } = await body(request, 2000);
    if (!await credentialsMatch(email, password)) return json({ error: "Incorrect email or password." }, 401);
    const response = json({ ok: true });
    response.cookies.set(sessionName, createSession(), { ...cookie(), maxAge: sessionLifetime });
    return response;
  } catch (error) {
    return failure(error, "Sign-in is temporarily unavailable.");
  }
}

export async function DELETE(request) {
  if (rejectOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const response = json({ ok: true });
  response.cookies.set(sessionName, "", { ...cookie(), maxAge: 0 });
  return response;
}
