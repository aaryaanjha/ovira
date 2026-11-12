"use client";

import { useState } from "react";
import { dateLabel, postStatuses } from "../../lib/content.mjs";

const blank = { id: "", title: "", category: "", description: "", intro: "", status: "Draft", sections: [] };

function Editor({ post, save, close }) {
  const [draft, setDraft] = useState(post);
  function field(event) {
    const { name, value } = event.target;
    setDraft(current => ({ ...current, [name]: value }));
  }
  function section(index, part, value) {
    setDraft(current => ({ ...current, sections: current.sections.map((entry, i) =>
      i === index ? entry.map((text, j) => j === part ? value : text) : entry
    ) }));
  }
  return <form className="admin-panel admin-editor" onSubmit={event => { event.preventDefault(); void save(draft); }}>
    <div className="admin-editor-top"><h2>{post.id ? "Edit post" : "New post"}</h2><button className="admin-button quiet" type="button" onClick={close}>Close editor</button></div>
    <label>Title<input name="title" value={draft.title} onChange={field} maxLength={160} required /></label>
    <div className="admin-editor-fields">
      <label>Category<input name="category" value={draft.category} onChange={field} maxLength={70} required /></label>
      <label>Status<select name="status" value={draft.status} onChange={field}>{postStatuses.map(status => <option key={status}>{status}</option>)}</select></label>
    </div>
    <label>Journal summary<textarea name="description" value={draft.description} onChange={field} maxLength={300} rows={2} required={draft.status === "Published"} /></label>
    <label>Introduction<textarea name="intro" value={draft.intro} onChange={field} maxLength={2500} rows={4} required={draft.status === "Published"} /></label>
    {draft.sections.map(([heading, text], i) => <fieldset className="admin-section" key={i}>
      <legend>Section {i + 1}</legend>
      <label>Heading<input value={heading} onChange={event => section(i, 0, event.target.value)} maxLength={160} required /></label>
      <label>Body<textarea value={text} onChange={event => section(i, 1, event.target.value)} maxLength={5000} rows={5} required /></label>
      <button type="button" className="admin-button quiet" onClick={() => setDraft(current => ({ ...current, sections: current.sections.filter((_, index) => index !== i) }))}>Remove section</button>
    </fieldset>)}
    <div className="admin-editor-actions">
      <button type="button" className="admin-button quiet" disabled={draft.sections.length >= 20}
        onClick={() => setDraft(current => ({ ...current, sections: [...current.sections, ["", ""]] }))}>Add section</button>
      <button className="admin-button primary" type="submit">Save post</button>
    </div>
  </form>;
}

export default function Posts({ posts, save }) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const matches = posts.filter(post => [post.title, post.category, post.status].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  if (editing) return <Editor key={editing.id || "new"} post={editing} save={save} close={() => setEditing(null)} />;
  return <>
    <div className="admin-post-tools">
      <label className="admin-search">Search posts<input type="search" value={query} placeholder="Title, category, or status" onChange={event => setQuery(event.target.value)} /></label>
      <button className="admin-button primary" type="button" onClick={() => setEditing(blank)}>Add post</button>
    </div>
    <div className="admin-list">
      {matches.map(post => <div className="admin-post-row" key={post.id}>
        <div className="admin-record-name"><strong>{post.title}</strong><small>{post.category}{post.publishedAt ? " · " + dateLabel(post.publishedAt) : ""}</small></div>
        <span className="admin-tag" data-status={post.status}>{post.status}</span>
        <div className="admin-post-actions">
          {post.status === "Published" && <a href={"/article/" + encodeURIComponent(post.id)} target="_blank" rel="noreferrer">View ↗</a>}
          <button type="button" className="admin-button quiet" onClick={() => setEditing(post)}>Edit</button>
        </div>
      </div>)}
      {!matches.length && <p className="admin-panel">{posts.length ? "No posts match your search." : "Add a post to start the journal."}</p>}
    </div>
  </>;
}
