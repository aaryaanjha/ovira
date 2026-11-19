"use client";

import { useEffect, useState } from "react";
import { request } from "./request";
import Leads from "./Leads";
import Posts from "./Posts";
import {
  AdminProfile, Analytics, AppointmentManager, BannerManager, ContactEditor, MediaManager,
  MythManager, SocialManager, TestimonialManager,
} from "./Management";

const groups = [
  { title: "Workspace", items: [["analytics", "Dashboard"]] },
  { title: "Content", items: [["blogs", "Blogs"], ["myths", "Myths & Facts"], ["testimonials", "Testimonials"]] },
  { title: "Leads & appointments", items: [["leads", "Leads"], ["appointments", "Appointments"]] },
  { title: "Website management", items: [["banners", "Banners & Media"], ["media", "Media library"], ["contact", "Contact information"], ["socials", "Social links"]] },
  { title: "Settings", items: [["profile", "Admin profile"]] },
];
const titles = Object.fromEntries(groups.flatMap(group => group.items));
const sheetsOnlyGroups = groups.map(group => ({
  ...group,
  items: group.items.filter(([key]) => ["analytics", "leads", "appointments", "profile"].includes(key)),
})).filter(group => group.items.length);

export default function Dashboard({ username, sheetsOnly = false }) {
  const [tab, setTab] = useState("analytics");
  const [loaded, setLoaded] = useState(null);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const visibleGroups = sheetsOnly ? sheetsOnlyGroups : groups;
  const data = loaded?.tab === tab && loaded.revision === revision ? loaded.data : undefined;

  useEffect(() => {
    if (tab === "profile") {
      setLoaded({ tab, revision, data: null });
      return;
    }
    const controller = new AbortController();
    request(tab, "GET", undefined, controller.signal)
      .then(result => setLoaded({ tab, revision, data: result }))
      .catch(loadError => { if (!controller.signal.aborted) { setError(loadError.message); setLoaded({ tab, revision, data: null }); } });
    return () => controller.abort();
  }, [tab, revision]);

  function refresh() {
    setError("");
    setRevision(value => value + 1);
  }

  async function save(resource, values) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const method = values.id ? "PATCH" : "POST";
      const result = await request(resource, method, values);
      setNotice(resource === "blogs" ? "Blog saved." : resource === "leads" ? "Lead updated." :
        resource === "appointments" ? "Appointment updated." : "Changes saved.");
      refresh();
      return result;
    } catch (saveError) {
      setError(saveError.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function remove(resource, id, label) {
    if (!window.confirm("Delete this " + label + "? This cannot be undone.")) return false;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await request(resource, "DELETE", { id });
      setNotice("Deleted.");
      refresh();
      return true;
    } catch (removeError) {
      setError(removeError.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    try {
      await request("session", "DELETE");
      window.location.assign("/admin");
    } catch (logoutError) {
      setError(logoutError.message);
    }
  }

  return <div className="admin-app">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/admin"><img src="/assets/ovira-logo.png" alt="" width="38" height="38" /> OVIRA <small>Admin</small></a>
      <nav className="admin-side-nav" aria-label="Admin panel">
        {visibleGroups.map(group => <section key={group.title}>
          <h2>{group.title}</h2>
          {group.items.map(([key, label]) => <button type="button" key={key} className={tab === key ? "active" : ""}
            aria-current={tab === key ? "page" : undefined} onClick={() => { setTab(key); setNotice(""); setError(""); }}>
            <span aria-hidden="true">{key === "analytics" ? "⌂" : key === "blogs" ? "▤" : key === "myths" ? "?" :
              key === "testimonials" ? "♡" : key === "leads" ? "↗" : key === "appointments" ? "◷" :
              key === "banners" || key === "media" ? "▧" : key === "contact" ? "✉" : key === "socials" ? "◎" : "◉"}</span>
            {label}
          </button>)}
        </section>)}
      </nav>
      <div className="admin-sidebar-profile">
        <span className="admin-profile-avatar" aria-hidden="true">{username.slice(0, 1).toUpperCase()}</span>
        <span><strong>{username}</strong><small>Administrator</small></span>
      </div>
      <button type="button" className="admin-sidebar-logout" onClick={logout}>Sign out</button>
      <a className="admin-sidebar-site" href="/">View website ↗</a>
    </aside>

    <main className="admin-main">
      <header className="admin-page-header">
        <div><p className="admin-kicker">OVIRA · ADMIN</p><h1>{titles[tab]}</h1></div>
        <button type="button" className="admin-button quiet" disabled={saving || tab === "profile"} onClick={refresh}>Refresh</button>
      </header>
      {sheetsOnly && <p className="admin-notice" role="status">Appointment and lead records are stored in the connected Google Sheet. Website content management requires a database.</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {tab !== "profile" && data === undefined && <div className="admin-panel" role="status">Loading {titles[tab].toLowerCase()}…</div>}
      {tab !== "profile" && data === null && !error && <p className="admin-panel">No data is available. Refresh to try again.</p>}
      <fieldset className="admin-workspace" disabled={saving}>
        {tab === "analytics" && data && <Analytics data={data} onNavigate={setTab} />}
        {tab === "leads" && data && <Leads leads={data} save={values => save("leads", values)} />}
        {tab === "appointments" && data && <AppointmentManager appointments={data} save={values => save("appointments", values)} />}
        {tab === "blogs" && data && <Posts posts={data} save={values => save("blogs", values)} remove={remove} />}
        {tab === "myths" && data && <MythManager items={data} save={values => save("myths", values)} remove={remove} />}
        {tab === "testimonials" && data && <TestimonialManager items={data} save={values => save("testimonials", values)} remove={remove} />}
        {tab === "banners" && data && <BannerManager slides={data} save={values => save("banners", values)} remove={remove} refresh={refresh} />}
        {tab === "media" && data && <MediaManager items={data} remove={remove} refresh={refresh} />}
        {tab === "contact" && data && <ContactEditor contact={data} save={values => save("contact", values)} />}
        {tab === "socials" && data && <SocialManager items={data} save={values => save("socials", values)} remove={remove} />}
        {tab === "profile" && <AdminProfile username={username} />}
      </fieldset>
      <footer className="admin-main-footer"><span>OVIRA Admin</span><span>{sheetsOnly ? "Appointment and lead changes are saved to Google Sheets." : "Changes publish to the website when saved."}</span></footer>
    </main>
  </div>;
}
