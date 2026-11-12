import { cookies } from "next/headers";
import { authConfigured, sessionName, validSession } from "../../lib/auth.mjs";
import Dashboard from "../../components/admin/Dashboard";
import StaffLogin from "../../components/admin/StaffLogin";
import "./admin.css";

export const metadata = { title: "Staff dashboard", robots: { index: false, follow: false } };

export default async function Admin() {
  const session = (await cookies()).get(sessionName)?.value;
  return validSession(session) ? <Dashboard /> : <StaffLogin configured={authConfigured()} />;
}
