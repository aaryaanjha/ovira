import { cookies, headers } from "next/headers";
import { authConfigured, authSetupProblems, currentUsername, sessionName, validSession } from "../../lib/auth.mjs";
import Dashboard from "../../components/admin/Dashboard";
import StaffLogin from "../../components/admin/StaffLogin";
import { sheetsOnlyAdmin } from "../../lib/store.mjs";
import { setupStatus } from "../../lib/setup.mjs";
import "./admin.css";

export const metadata = { title: "Staff dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Admin() {
  const session = (await cookies()).get(sessionName)?.value;
  if (!validSession(session)) {
    // Only setting names are shown, and only while sign-in is unusable anyway.
    return <StaffLogin configured={authConfigured()} problems={authConfigured() ? [] : authSetupProblems()} />;
  }
  const setup = await setupStatus((await headers()).get("host") || "");
  return <Dashboard username={currentUsername()} sheetsOnly={sheetsOnlyAdmin()} setup={setup} />;
}
