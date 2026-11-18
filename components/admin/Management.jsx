"use client";

import { useEffect, useState } from "react";
import { appointmentStatuses, dateLabel, leadStatuses, postStatuses } from "../../lib/content.mjs";

const emptyMyth = { myth: "", fact: "", more: "", status: "Draft", position: 0 };
const emptyTestimonial = { name: "", content: "", details: "", profileImage: "", rating: "", status: "Draft", position: 0 };
const emptySlide = { image: "", alt: "", caption: "", enabled: true, position: 0 };
const toFormObject = form => Object.fromEntries(new FormData(form));

export function ImageField({ label, value, onChange, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(value || "");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(value || "");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, value]);

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Image upload failed.");
      onChange(result.data.url);
      onUploaded?.(result.data);
      setFile(null);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  return <div className="admin-image-field">
    <label>{label} URL<input value={value || ""} maxLength={500} placeholder="/assets/image.webp or an uploaded image" onChange={event => { onChange(event.target.value); setFile(null); }} /></label>
    <label>Or upload a JPG, PNG, or WebP (5 MB max)<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={event => { setError(""); setFile(event.target.files?.[0] || null); event.target.value = ""; }} /></label>
    {preview && <img className="admin-image-preview" src={preview} alt="Selected image preview" />}
    {file && <button className="admin-button quiet" type="button" disabled={uploading} onClick={upload}>{uploading ? "Uploading…" : "Upload selected image"}</button>}
    {error && <p className="admin-error" role="alert">{error}</p>}
  </div>;
}

function SearchBox({ label, query, setQuery, placeholder }) {
  return <label className="admin-search">{label}<input type="search" value={query} placeholder={placeholder} onChange={event => setQuery(event.target.value)} /></label>;
}

export function AppointmentManager({ appointments, save }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const matches = appointments.filter(item => (!status || item.status === status) &&
    [item.name, item.phone, item.email, item.message].some(value => value.toLowerCase().includes(query.trim().toLowerCase())));
  return <>
    <div className="admin-toolbar">
      <SearchBox label="Search appointments" query={query} setQuery={setQuery} placeholder="Name, phone, or email" />
      <label className="admin-filter">Status<select value={status} onChange={event => setStatus(event.target.value)}>
        <option value="">All statuses</option>{appointmentStatuses.map(value => <option key={value}>{value}</option>)}
      </select></label>
    </div>
    <div className="admin-list">
      {matches.map(item => <Appointment key={item.id} item={item} save={save} />)}
      {!matches.length && <p className="admin-panel">{appointments.length ? "No appointments match these filters." : "Appointment requests will appear here when someone uses the website form."}</p>}
    </div>
  </>;
}

function Appointment({ item, save }) {
  return <details className="admin-record">
    <summary>
      <span className="admin-record-name"><strong>{item.name}</strong><small>{item.phone}{item.email ? " · " + item.email : ""}</small></span>
      <span className="admin-record-date">{dateLabel(item.createdAt)}</span>
      <span className="admin-tag" data-status={item.status}>{item.status}</span>
    </summary>
    <div className="admin-record-body">
      <dl className="lead-info">
        <div><dt>Preferred date</dt><dd>{item.preferredDate || "Not specified"}</dd></div>
        <div><dt>Preferred time</dt><dd>{item.preferredTime || "Not specified"}</dd></div>
        <div><dt>Message</dt><dd>{item.message || "No additional message"}</dd></div>
        <div><dt>Submitted</dt><dd>{new Date(item.createdAt).toLocaleString()}</dd></div>
      </dl>
      <form className="admin-lead-form" onSubmit={event => {
        event.preventDefault();
        void save({ ...toFormObject(event.currentTarget), id: item.id, updatedAt: item.updatedAt });
      }}>
        <label>Status<select name="status" defaultValue={item.status}>{appointmentStatuses.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Internal notes<textarea name="notes" defaultValue={item.notes} maxLength={2000} rows={3} /></label>
        <button className="admin-button primary" type="submit">Save appointment</button>
      </form>
    </div>
  </details>;
}

export function MythManager({ items, save, remove }) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const matches = items.filter(item => [item.myth, item.fact, item.status].join(" ").toLowerCase().includes(query.toLowerCase()));
  return <>
    <div className="admin-toolbar">
      <SearchBox label="Search myths & facts" query={query} setQuery={setQuery} placeholder="Search myth or fact" />
      <button className="admin-button primary" type="button" onClick={() => setEditing(emptyMyth)}>Add myth &amp; fact</button>
    </div>
    {editing && <MythForm key={editing.id || "new"} item={editing} save={async values => { const result = await save(values); if (result) setEditing(null); return result; }} close={() => setEditing(null)} />}
    <div className="admin-list">
      {matches.map(item => <div className="admin-post-row" key={item.id}>
        <div className="admin-record-name"><strong>{item.myth}</strong><small>{item.status} · Order {item.position}</small><p>{item.fact}</p></div>
        <div className="admin-post-actions">
          <button type="button" className="admin-button quiet" onClick={() => setEditing(item)}>Edit</button>
          <button type="button" className="admin-button danger" onClick={() => remove("myths", item.id, "myth & fact")}>Delete</button>
        </div>
      </div>)}
      {!matches.length && <p className="admin-panel">{items.length ? "No entries match your search." : "Add a myth and fact to publish this section."}</p>}
    </div>
  </>;
}

function MythForm({ item, save, close }) {
  return <form className="admin-panel admin-editor" onSubmit={event => { event.preventDefault(); void save({ ...toFormObject(event.currentTarget), id: item.id || "", updatedAt: item.updatedAt || "" }); }}>
    <div className="admin-editor-top"><h2>{item.id ? "Edit myth & fact" : "Add myth & fact"}</h2><button className="admin-button quiet" type="button" onClick={close}>Close editor</button></div>
    <label>Myth<input name="myth" defaultValue={item.myth} maxLength={500} required /></label>
    <label>Fact<textarea name="fact" defaultValue={item.fact} maxLength={3000} rows={3} required /></label>
    <label>Short explanation (optional)<textarea name="more" defaultValue={item.more} maxLength={5000} rows={4} /></label>
    <div className="admin-editor-fields">
      <label>Status<select name="status" defaultValue={item.status || "Draft"}>{postStatuses.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Display order<input name="position" type="number" min="0" max="10000" defaultValue={item.position || 0} /></label>
    </div>
    <button className="admin-button primary" type="submit">Save entry</button>
  </form>;
}

export function TestimonialManager({ items, save, remove }) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const matches = items.filter(item => [item.name, item.content, item.details, item.status].join(" ").toLowerCase().includes(query.toLowerCase()));
  return <>
    <div className="admin-toolbar">
      <SearchBox label="Search testimonials" query={query} setQuery={setQuery} placeholder="Name or testimonial" />
      <button className="admin-button primary" type="button" onClick={() => setEditing(emptyTestimonial)}>Add testimonial</button>
    </div>
    {editing && <TestimonialForm key={editing.id || "new"} item={editing} save={async values => { const result = await save(values); if (result) setEditing(null); return result; }} close={() => setEditing(null)} />}
    <div className="admin-list">
      {matches.map(item => <div className="admin-post-row" key={item.id}>
        <div className="admin-record-name"><strong>{item.name}</strong><small>{item.status} · Order {item.position}{item.rating ? " · " + item.rating + "/5" : ""}</small><p>{item.content}</p></div>
        <div className="admin-post-actions">
          <button type="button" className="admin-button quiet" onClick={() => setEditing(item)}>Edit</button>
          <button type="button" className="admin-button danger" onClick={() => remove("testimonials", item.id, "testimonial")}>Delete</button>
        </div>
      </div>)}
      {!matches.length && <p className="admin-panel">{items.length ? "No testimonials match your search." : "No testimonials are published yet."}</p>}
    </div>
  </>;
}

function TestimonialForm({ item, save, close }) {
  const [profileImage, setProfileImage] = useState(item.profileImage || "");
  return <form className="admin-panel admin-editor" onSubmit={event => {
    event.preventDefault();
    void save({ ...toFormObject(event.currentTarget), profileImage, id: item.id || "", updatedAt: item.updatedAt || "" });
  }}>
    <div className="admin-editor-top"><h2>{item.id ? "Edit testimonial" : "Add testimonial"}</h2><button className="admin-button quiet" type="button" onClick={close}>Close editor</button></div>
    <label>Person’s name<input name="name" defaultValue={item.name} maxLength={120} required /></label>
    <label>Testimonial<textarea name="content" defaultValue={item.content} maxLength={3000} rows={4} required /></label>
    <label>Role or description<input name="details" defaultValue={item.details} maxLength={200} /></label>
    <ImageField label="Profile image" value={profileImage} onChange={setProfileImage} />
    <div className="admin-editor-fields">
      <label>Rating (optional)<select name="rating" defaultValue={item.rating || ""}><option value="">No rating</option>{[1, 2, 3, 4, 5].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Status<select name="status" defaultValue={item.status || "Draft"}>{postStatuses.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Display order<input name="position" type="number" min="0" max="10000" defaultValue={item.position || 0} /></label>
    </div>
    <button className="admin-button primary" type="submit">Save testimonial</button>
  </form>;
}

export function BannerManager({ slides, save, remove, refresh }) {
  const [editing, setEditing] = useState(null);
  return <>
    <div className="admin-toolbar">
      <p>Manage the homepage photo carousel. Uploaded images are validated and saved on this server.</p>
      <button className="admin-button primary" type="button" onClick={() => setEditing(emptySlide)}>Add slide</button>
    </div>
    {editing && <SlideForm key={editing.id || "new"} item={editing} save={async values => { const result = await save(values); if (result) setEditing(null); return result; }} close={() => setEditing(null)} refresh={refresh} />}
    <div className="admin-media-grid">
      {slides.map(slide => <article className="admin-media-card" key={slide.id}>
        <img src={slide.image} alt={slide.alt} />
        <div><strong>{slide.caption}</strong><small>{slide.enabled ? "Enabled" : "Disabled"} · Order {slide.position}</small></div>
        <div className="admin-post-actions">
          <button className="admin-button quiet" type="button" onClick={() => setEditing(slide)}>Edit</button>
          <button className="admin-button danger" type="button" onClick={() => remove("banners", slide.id, "slide")}>Delete</button>
        </div>
      </article>)}
      {!slides.length && <p className="admin-panel">No slides are configured yet.</p>}
    </div>
  </>;
}

function SlideForm({ item, save, close, refresh }) {
  const [image, setImage] = useState(item.image || "");
  return <form className="admin-panel admin-editor" onSubmit={event => {
    event.preventDefault();
    void save({ ...toFormObject(event.currentTarget), image, enabled: event.currentTarget.elements.enabled.checked, id: item.id || "" });
  }}>
    <div className="admin-editor-top"><h2>{item.id ? "Edit slide" : "Add slide"}</h2><button className="admin-button quiet" type="button" onClick={close}>Close editor</button></div>
    <ImageField label="Slide image" value={image} onChange={setImage} onUploaded={refresh} />
    <label>Accessible image description<input name="alt" defaultValue={item.alt} maxLength={250} required /></label>
    <label>Caption<input name="caption" defaultValue={item.caption} maxLength={160} required /></label>
    <div className="admin-editor-fields">
      <label>Display order<input name="position" type="number" min="0" max="10000" defaultValue={item.position || 0} /></label>
      <label className="admin-checkbox"><input type="checkbox" name="enabled" defaultChecked={item.enabled ?? true} /> Show this slide</label>
    </div>
    <button className="admin-button primary" type="submit">Save slide</button>
  </form>;
}

export function MediaManager({ items, remove, refresh }) {
  const [uploadError, setUploadError] = useState("");
  return <>
    <div className="admin-panel admin-media-upload">
      <h2>Upload an image</h2>
      <p>Use JPG, PNG, or WebP images up to 5 MB. Uploads are available to Blogs, Testimonials, and Banners.</p>
      <ImageField label="Image library" value="" onChange={() => {}} onUploaded={() => { setUploadError(""); refresh(); }} />
      {uploadError && <p className="admin-error" role="alert">{uploadError}</p>}
    </div>
    <div className="admin-media-grid">
      {items.map(item => <article className="admin-media-card" key={item.id}>
        <img src={"/media/" + item.id} alt={item.fileName} />
        <div><strong>{item.fileName}</strong><small>{Math.ceil(item.size / 1024)} KB · {dateLabel(item.createdAt)}</small></div>
        <button className="admin-button danger" type="button" onClick={() => remove("media", item.id, "image")}>Delete</button>
      </article>)}
      {!items.length && <p className="admin-panel">No uploaded images yet.</p>}
    </div>
  </>;
}

export function ContactEditor({ contact, save }) {
  return <form className="admin-panel admin-contact" onSubmit={event => { event.preventDefault(); void save(toFormObject(event.currentTarget)); }}>
    <p>These details appear on the public Contact Us section and in the footer.</p>
    <label>Company name<input name="companyName" defaultValue={contact.companyName} maxLength={200} required /></label>
    <label>Full address<textarea name="address" defaultValue={contact.address} maxLength={500} rows={4} required /></label>
    <div className="admin-editor-fields">
      <label>Phone number<input name="phone" type="tel" defaultValue={contact.phone} maxLength={40} required /></label>
      <label>WhatsApp number<input name="whatsapp" type="tel" defaultValue={contact.whatsapp} maxLength={40} required /><small>Include the country code.</small></label>
      <label>Email address<input name="email" type="email" defaultValue={contact.email} maxLength={254} required /></label>
      <label>Google Maps link (optional)<input name="mapsUrl" type="url" defaultValue={contact.mapsUrl} maxLength={500} placeholder="https://maps.google.com/…" /></label>
    </div>
    <button className="admin-button primary" type="submit">Save contact information</button>
  </form>;
}

export function SocialManager({ items, save, remove }) {
  const [editing, setEditing] = useState(null);
  return <>
    <div className="admin-toolbar">
      <p>Only enabled links with valid web addresses are shown on the public website.</p>
      <button className="admin-button primary" type="button" onClick={() => setEditing({ platform: "", url: "", enabled: true, position: items.length })}>Add social link</button>
    </div>
    {editing && <form className="admin-panel admin-editor" onSubmit={event => {
      event.preventDefault();
      void save({ ...toFormObject(event.currentTarget), enabled: event.currentTarget.elements.enabled.checked, id: editing.id || "" }).then(result => { if (result) setEditing(null); });
    }}>
      <div className="admin-editor-top"><h2>{editing.id ? "Edit social link" : "Add social link"}</h2><button className="admin-button quiet" type="button" onClick={() => setEditing(null)}>Close editor</button></div>
      <label>Platform<input name="platform" defaultValue={editing.platform} maxLength={50} placeholder="Instagram" required /></label>
      <label>Link<input name="url" type="url" defaultValue={editing.url} maxLength={500} placeholder="https://…" /></label>
      <div className="admin-editor-fields">
        <label>Display order<input name="position" type="number" min="0" max="10000" defaultValue={editing.position || 0} /></label>
        <label className="admin-checkbox"><input type="checkbox" name="enabled" defaultChecked={editing.enabled} /> Enable this link</label>
      </div>
      <button className="admin-button primary" type="submit">Save social link</button>
    </form>}
    <div className="admin-list">
      {items.map(item => <div className="admin-post-row" key={item.id}>
        <div className="admin-record-name"><strong>{item.platform}</strong><small>{item.enabled ? "Enabled" : "Disabled"} · {item.url}</small></div>
        <div className="admin-post-actions">
          <button className="admin-button quiet" type="button" onClick={() => setEditing(item)}>Edit</button>
          <button className="admin-button danger" type="button" onClick={() => remove("socials", item.id, "social link")}>Delete</button>
        </div>
      </div>)}
      {!items.length && <p className="admin-panel">Add a social link when you are ready.</p>}
    </div>
  </>;
}

export function AdminProfile({ username }) {
  return <section className="admin-panel admin-profile">
    <h2>Admin profile</h2>
    <dl><div><dt>Username</dt><dd>{username}</dd></div><div><dt>Session</dt><dd>Secure, HttpOnly cookie · expires after 8 hours</dd></div></dl>
    <p>Password credentials are stored as a server-side scrypt hash in environment configuration. Keep them private.</p>
  </section>;
}

export function Analytics({ data, onNavigate }) {
  const summary = data.summary;
  return <>
    <div className="admin-metrics">
      <Metric label="Total leads" value={summary.totalLeads} />
      <Metric label="New leads" value={summary.newLeads} />
      <Metric label="Total appointments" value={summary.totalAppointments} />
      <Metric label="Pending follow-ups" value={summary.pendingFollowUps} />
    </div>
    <div className="admin-chart-grid">
      <Chart title="Leads received · last 14 days" items={data.leadsByDay} />
      <Chart title="Appointment requests · last 14 days" items={data.appointmentTrends} />
      <section className="admin-panel admin-status-chart">
        <h2>Lead status</h2>
        {data.leadStatuses.length ? data.leadStatuses.map(item => <div className="admin-status-row" key={item.status}>
          <span>{item.status}</span><div className="admin-status-track"><span style={{ width: (item.count / Math.max(1, summary.totalLeads) * 100) + "%" }} /></div><strong>{item.count}</strong>
        </div>) : <p>No lead activity yet.</p>}
      </section>
    </div>
    <section className="admin-panel admin-recent">
      <div className="admin-editor-top"><h2>Recent activity</h2><span>Latest website updates and enquiries</span></div>
      <ActivityGroup title="Latest leads" items={data.recentLeads} name={item => item.name} date={item => dateLabel(item.createdAt)} onClick={() => onNavigate("leads")} />
      <ActivityGroup title="Appointment requests" items={data.recentAppointments} name={item => item.name} date={item => dateLabel(item.createdAt)} onClick={() => onNavigate("appointments")} />
      <ActivityGroup title="Published blogs" items={data.recentBlogs} name={item => item.title} date={item => dateLabel(item.updatedAt)} onClick={() => onNavigate("blogs")} />
      <ActivityGroup title="Testimonials" items={data.recentTestimonials} name={item => item.name} date={item => dateLabel(item.updatedAt)} onClick={() => onNavigate("testimonials")} />
    </section>
  </>;
}

function Metric({ label, value }) {
  return <article className="admin-panel admin-metric"><span>{label}</span><strong>{value}</strong></article>;
}

function Chart({ title, items }) {
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (13 - index));
    const day = date.toISOString().slice(0, 10);
    return { day, count: items.find(item => item.day === day)?.count || 0 };
  });
  const max = Math.max(1, ...days.map(item => item.count));
  return <section className="admin-panel admin-chart">
    <h2>{title}</h2>
    <svg viewBox="0 0 420 150" role="img" aria-label={title}>
      <line x1="20" x2="410" y1="126" y2="126" />
      {days.map((item, index) => {
        const height = item.count / max * 100;
        return <rect key={item.day} x={24 + index * 27} y={126 - height} width="17" height={height || 2} rx="4">
          <title>{item.day}: {item.count}</title>
        </rect>;
      })}
    </svg>
    <div className="admin-chart-labels"><span>{days[0].day.slice(5)}</span><span>{days[6].day.slice(5)}</span><span>{days[13].day.slice(5)}</span></div>
    {!items.length && <p>No activity in this period yet.</p>}
  </section>;
}

function ActivityGroup({ title, items, name, date, onClick }) {
  return <div className="admin-activity-group">
    <h3>{title}</h3>
    {items.length ? items.map(item => <button type="button" className="admin-activity-item" key={item.id} onClick={onClick}>
      <span>{name(item)}</span><small>{date(item)}</small>
    </button>) : <p>No recent activity.</p>}
  </div>;
}
