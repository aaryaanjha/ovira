"use client";

import { useState } from "react";
import { request } from "./request";

export default function StaffLogin({ configured, problems = [] }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const { username, password } = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setError("");
    try {
      await request("session", "POST", { username, password });
      window.location.reload();
    } catch (error) {
      setError(error.message);
      setPending(false);
    }
  }
  return <main className="admin-login">
    <div className="admin-login-card">
      <a className="admin-brand" href="/"><img src="/assets/ovira-logo.png" alt="" width="42" height="42" /> OVIRA</a>
      <h1>Staff sign-in</h1>
      {configured ? <form method="post" action="/api/admin/session" onSubmit={submit}>
        <label>Username<input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={64} required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" maxLength={250} required /></label>
        <button type="submit" className="admin-button primary" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form> : <div className="admin-error" role="alert">
        <p><strong>Staff sign-in is not set up yet.</strong></p>
        {problems.length > 0 && <ul className="admin-setup-list">{problems.map(problem => <li key={problem}>{problem}</li>)}</ul>}
        <p>Add these in Vercel → Settings → Environment Variables for this project, then redeploy.</p>
      </div>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <a className="admin-back" href="/">← Back to the website</a>
    </div>
  </main>;
}
