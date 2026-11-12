"use client";

import { useEffect, useState } from "react";
import { request } from "./request";
import Leads from "./Leads";
import Posts from "./Posts";

const tabs = [["leads", "Appointment leads"], ["posts", "Journal"], ["contact", "Contact details"]];

function ContactEditor({ contact, save }) {
  return <form className="admin-panel admin-contact" onSubmit={event => {
    event.preventDefault();
    void save(Object.fromEntries(new FormData(event.currentTarget)));
  }}>
    <p>These details appear on the public website.</p>
    <label>Phone number<input name="phone" type="tel" defaultValue={contact.phone} maxLength={40} required /></label>
    <label>WhatsApp number<input name="whatsapp" type="tel" defaultValue={contact.whatsapp} maxLength={40} required />
      <small>Include the country code.</small></label>
    <label>Email address<input name="email" type="email" defaultValue={contact.email} maxLength={254} required /></label>
    <button className="admin-button primary" type="submit">Save contact details</button>
  </form>;
}

export default function Dashboard() {
  const [tab, setTab] = useState("leads");
  const [loaded, setLoaded] = useState(null);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const data = loaded?.tab === tab && loaded.revision === revision ? loaded.data : undefined;

  useEffect(() => {
    const controller = new AbortController();
    request(tab, "GET", undefined, controller.signal)
      .then(data => setLoaded({ tab, revision, data }))
      .catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoaded({ tab, revision, data: null }); } });
    return () => controller.abort();
  }, [tab, revision]);

  function refresh() {
    setError("");
    setRevision(value => value + 1);
  }

  async function save(values) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await request(tab, "PATCH", values);
      setNotice(tab === "posts" ? "Post saved." : tab === "leads" ? "Lead updated." : "Contact details updated.");
      refresh();
      return result;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    try {
      await request("session", "DELETE");
      window.location.reload();
    } catch (error) {
      setError(error.message);
    }
  }

  return <div className="admin-app">
    <header className="admin-top">
      <div className="admin-shell admin-top-inner">
        <a className="admin-brand" href="/admin"><img src="/assets/ovira-mark.webp" alt="" width="36" height="36" /> OVIRA <small>Staff</small></a>
        <div className="admin-top-actions"><a href="/">View website ↗</a><button type="button" className="admin-button quiet" onClick={logout}>Sign out</button></div>
      </div>
    </header>
    <main className="admin-shell admin-main">
      <nav className="admin-tabs" aria-label="Staff dashboard sections">
        {tabs.map(([key, label]) => <button type="button" key={key} aria-current={tab === key ? "page" : undefined} disabled={saving}
          onClick={() => { setTab(key); setNotice(""); setError(""); }}>{label}</button>)}
      </nav>
      <div className="admin-title"><h1>{tabs.find(([key]) => key === tab)[1]}</h1><button type="button" className="admin-button quiet" disabled={saving} onClick={refresh}>Refresh</button></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {data === undefined && <p role="status">Loading…</p>}
      {data && <fieldset className="admin-workspace" disabled={saving}>
        {tab === "leads" && <Leads leads={data} save={save} />}
        {tab === "posts" && <Posts posts={data} save={save} />}
        {tab === "contact" && <ContactEditor key={revision} contact={data} save={save} />}
      </fieldset>}
    </main>
  </div>;
}
