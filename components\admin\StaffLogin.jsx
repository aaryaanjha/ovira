"use client";

import { useState } from "react";
import { request } from "./request";

export default function StaffLogin({ configured }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setError("");
    try {
      await request("session", "POST", { email, password });
      window.location.reload();
    } catch (error) {
      setError(error.message);
      setPending(false);
    }
  }
  return <main className="admin-login">
    <div className="admin-login-card">
      <a className="admin-brand" href="/"><img src="/assets/ovira-mark.webp" alt="" width="42" height="42" /> OVIRA</a>
      <h1>Staff sign-in</h1>
      {configured ? <form method="post" action="/api/admin/session" onSubmit={submit}>
        <label>Email<input name="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={254} required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" maxLength={250} required /></label>
        <button type="submit" className="admin-button primary" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form> : <p className="admin-error">Staff sign-in is awaiting setup.</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <a className="admin-back" href="/">← Back to the website</a>
    </div>
  </main>;
}
