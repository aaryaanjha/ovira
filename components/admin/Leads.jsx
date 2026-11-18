"use client";

import { useState } from "react";
import { dateLabel, leadStatuses } from "../../lib/content.mjs";

const pageSize = 20;

function exportCsv(leads) {
  const columns = ["id", "name", "phone", "email", "source", "createdAt", "status", "notes"];
  const cell = value => '"' + String(value ?? "").replace(/"/g, '""') + '"';
  const csv = [columns, ...leads.map(lead => columns.map(key => lead[key]))].map(row => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "ovira-leads.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function Lead({ lead, save }) {
  return <details className="admin-record">
    <summary>
      <span className="admin-record-name"><strong>{lead.name}</strong><small>{lead.phone} · {lead.contact} · {lead.source || "Website"}</small></span>
      <span className="admin-record-date">{dateLabel(lead.createdAt)}</span>
      <span className="admin-tag" data-status={lead.status}>{lead.status}</span>
    </summary>
    <div className="admin-record-body">
      <dl className="lead-info">
        <div><dt>Phone</dt><dd><a href={"tel:" + lead.phone.replace(/[^+\d]/g, "")}>{lead.phone}</a></dd></div>
        {lead.email && <div><dt>Email</dt><dd><a href={"mailto:" + lead.email}>{lead.email}</a></dd></div>}
        {lead.address && <div><dt>City or area</dt><dd>{lead.address}</dd></div>}
        <div><dt>Lead ID</dt><dd>{lead.id}</dd></div>
        <div><dt>Source</dt><dd>{lead.source || "Website"}</dd></div>
        <div><dt>Preferred date and time</dt><dd>{lead.preferredDate || "Not specified"}{lead.preferredTime ? " · " + lead.preferredTime : ""}</dd></div>
        {lead.message && <div><dt>Visitor’s message</dt><dd>{lead.message}</dd></div>}
      </dl>
      <form className="admin-lead-form" onSubmit={event => {
        event.preventDefault();
        void save({ ...Object.fromEntries(new FormData(event.currentTarget)), id: lead.id, updatedAt: lead.updatedAt });
      }}>
        <label>Status<select name="status" defaultValue={lead.status}>
          {leadStatuses.map(value => <option key={value}>{value}</option>)}
        </select></label>
        <label>Staff notes<textarea name="notes" defaultValue={lead.notes} maxLength={2000} rows={3} /></label>
        <button className="admin-button primary" type="submit">Save lead</button>
      </form>
    </div>
  </details>;
}

export default function Leads({ leads, save }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const term = query.trim().toLowerCase();
  const matches = leads.filter(lead => (!status || lead.status === status) &&
    (!from || lead.createdAt.slice(0, 10) >= from) && (!to || lead.createdAt.slice(0, 10) <= to) &&
    [lead.name, lead.phone, lead.email, lead.id].some(value => value.toLowerCase().includes(term)));
  matches.sort((a, b) => sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
  const lastPage = Math.max(0, Math.ceil(matches.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  return <>
    <div className="lead-counts" aria-label="Filter leads by status">
      {["", ...leadStatuses].map(value => <button type="button" key={value} aria-pressed={value === status} data-status={value}
        onClick={() => { setStatus(value); setPage(0); }}>
        <span>{value || "All leads"}</span><strong>{value ? leads.filter(lead => lead.status === value).length : leads.length}</strong>
      </button>)}
    </div>
    <div className="admin-toolbar">
      <label className="admin-search">Search leads<input type="search" value={query} placeholder="Name, phone, or email" onChange={event => { setQuery(event.target.value); setPage(0); }} /></label>
      <label className="admin-filter">From<input type="date" value={from} onChange={event => { setFrom(event.target.value); setPage(0); }} /></label>
      <label className="admin-filter">To<input type="date" value={to} onChange={event => { setTo(event.target.value); setPage(0); }} /></label>
      <label className="admin-filter">Sort<select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      <button className="admin-button quiet" type="button" disabled={!matches.length} onClick={() => exportCsv(matches)}>Export filtered CSV</button>
    </div>
    <div className="admin-list">
      {matches.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(lead => <Lead key={lead.id + lead.updatedAt} lead={lead} save={save} />)}
      {!matches.length && <p className="admin-panel">{leads.length ? "No leads match these filters." : "New appointment requests will appear here."}</p>}
    </div>
    {lastPage > 0 && <div className="admin-pagination">
      <button type="button" className="admin-button quiet" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button>
      <span>Page {currentPage + 1} of {lastPage + 1}</span>
      <button type="button" className="admin-button quiet" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Next</button>
    </div>}
  </>;
}
