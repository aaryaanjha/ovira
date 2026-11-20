import { authConfigured, createSession, credentialsMatch, currentUsername, sessionLifetime, sessionName, validSession } from "../../../../lib/auth.mjs";
import { body, clientIpKnown, failure, json, limited, rejectOrigin } from "../../../../lib/http.mjs";
import { cookies } from "next/headers";

const cookie = () => ({
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.VERCEL === "1" || (process.env.APP_ORIGIN || "").trim().startsWith("https://"),
  path: "/",
  priority: "high",
});

export async function GET() {
  const token = (await cookies()).get(sessionName)?.value;
  if (!validSession(token)) return json({ error: "Sign in to continue." }, 401);
  return json({ data: { username: currentUsername() } });
}

export async function POST(request) {
  if (rejectOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  if (!authConfigured()) return json({ error: "Staff sign-in has not been configured." }, 503);
  // 8 attempts per visitor IP per 15 minutes; a looser shared cap applies when the IP is unknown.
  if (limited(request, "admin", clientIpKnown() ? 8 : 30, 15 * 60000)) return json({ error: "Too many sign-in attempts. Try again in 15 minutes." }, 429);
  try {
    const { username, password } = await body(request, 2000);
    if (!await credentialsMatch(username, password)) return json({ error: "Incorrect username or password." }, 401);
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
