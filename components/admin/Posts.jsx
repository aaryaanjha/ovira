"use client";

import { useState } from "react";
import { dateLabel, postStatuses } from "../../lib/content.mjs";
import { ImageField } from "./Management";

const blank = {
  id: "", title: "", slug: "", category: "", description: "", intro: "", sections: [],
  featuredImage: "", author: "OVIRA", status: "Draft", seoTitle: "", metaDescription: "",
};
const makeSlug = title => title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function Editor({ post, save, close }) {
  const [draft, setDraft] = useState({ ...blank, ...post });
  const [editingSlug, setEditingSlug] = useState(Boolean(post.id));
  const [preview, setPreview] = useState(false);

  function field(event) {
    const { name, value } = event.target;
    setDraft(current => ({ ...current, [name]: value, ...(name === "title" && !editingSlug ? { slug: makeSlug(value) } : {}) }));
  }

  function section(index, part, value) {
    setDraft(current => ({ ...current, sections: current.sections.map((entry, i) =>
      i === index ? entry.map((text, j) => j === part ? value : text) : entry
    ) }));
  }

  async function submit(event) {
    event.preventDefault();
    const result = await save(draft);
    if (result) close();
  }

  return <form className="admin-panel admin-editor" onSubmit={submit}>
    <div className="admin-editor-top"><h2>{post.id ? "Edit blog" : "New blog"}</h2><button className="admin-button quiet" type="button" onClick={close}>Close editor</button></div>
    <label>Title<input name="title" value={draft.title} onChange={field} maxLength={160} required /></label>
    <label>URL slug<input name="slug" value={draft.slug} onChange={event => { setEditingSlug(true); field(event); }} maxLength={80} pattern="[a-zA-Z0-9-]+" required /><small>Used in the blog URL. Lowercase letters, numbers, and hyphens only.</small></label>
    <div className="admin-editor-fields">
      <label>Category<input name="category" value={draft.category} onChange={field} maxLength={70} required /></label>
      <label>Author<input name="author" value={draft.author} onChange={field} maxLength={100} /></label>
      <label>Status<select name="status" value={draft.status} onChange={field}>{postStatuses.map(status => <option key={status}>{status}</option>)}</select></label>
      <label>Publish date<input value={draft.publishedAt ? new Date(draft.publishedAt).toLocaleDateString() : "Set when published"} readOnly /></label>
    </div>
    <label>Short description<textarea name="description" value={draft.description} onChange={field} maxLength={300} rows={2} required={draft.status === "Published"} /></label>
    <label>Introduction<textarea name="intro" value={draft.intro} onChange={field} maxLength={2500} rows={4} required={draft.status === "Published"} /></label>
    <ImageField label="Featured image" value={draft.featuredImage} onChange={featuredImage => setDraft(current => ({ ...current, featuredImage }))} />
    {draft.sections.map(([heading, text], index) => <fieldset className="admin-section" key={index}>
      <legend>Section {index + 1}</legend>
      <label>Heading<input value={heading} onChange={event => section(index, 0, event.target.value)} maxLength={160} required /></label>
      <label>Body<textarea value={text} onChange={event => section(index, 1, event.target.value)} maxLength={5000} rows={5} required /></label>
      <button type="button" className="admin-button danger" onClick={() => setDraft(current => ({ ...current, sections: current.sections.filter((_, itemIndex) => itemIndex !== index) }))}>Remove section</button>
    </fieldset>)}
    <div className="admin-editor-fields">
      <label>SEO title<input name="seoTitle" value={draft.seoTitle} onChange={field} maxLength={160} /></label>
      <label>Meta description<textarea name="metaDescription" value={draft.metaDescription} onChange={field} maxLength={300} rows={2} /></label>
    </div>
    <div className="admin-editor-actions">
      <button type="button" className="admin-button quiet" disabled={draft.sections.length >= 20}
        onClick={() => setDraft(current => ({ ...current, sections: [...current.sections, ["", ""]] }))}>Add section</button>
      <button type="button" className="admin-button quiet" onClick={() => setPreview(value => !value)}>{preview ? "Hide preview" : "Preview blog"}</button>
      <button className="admin-button primary" type="submit">{draft.status === "Published" ? "Publish blog" : "Save draft"}</button>
    </div>
    {preview && <article className="admin-blog-preview">
      {draft.featuredImage && <img src={draft.featuredImage} alt="" />}
      <p>{draft.category || "Category"} · {draft.author || "OVIRA"}</p><h2>{draft.title || "Blog title"}</h2>
      <p>{draft.description || "Short description preview"}</p><p>{draft.intro || "Introduction preview"}</p>
      {draft.sections.map(([heading, text], index) => <section key={index}><h3>{heading || "Section heading"}</h3><p>{text}</p></section>)}
    </article>}
  </form>;
}

export default function Posts({ posts, save, remove }) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const matches = posts.filter(post => (!status || post.status === status) &&
    [post.title, post.slug, post.category, post.status].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  if (editing) return <Editor key={editing.id || "new"} post={editing} save={save} close={() => setEditing(null)} />;
  return <>
    <div className="admin-toolbar">
      <label className="admin-search">Search blogs<input type="search" value={query} placeholder="Title, slug, category, or status" onChange={event => setQuery(event.target.value)} /></label>
      <label className="admin-filter">Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{postStatuses.map(item => <option key={item}>{item}</option>)}</select></label>
      <button className="admin-button primary" type="button" onClick={() => setEditing(blank)}>Add blog</button>
    </div>
    <div className="admin-list">
      {matches.map(post => <div className="admin-post-row" key={post.id}>
        <div className="admin-record-name"><strong>{post.title}</strong><small>/{post.slug} · {post.category} · {post.status}{post.publishedAt ? " · " + dateLabel(post.publishedAt) : ""}</small></div>
        <div className="admin-post-actions">
          {post.status === "Published" && <a href={"/article/" + encodeURIComponent(post.slug)} target="_blank" rel="noreferrer">View ↗</a>}
          <button type="button" className="admin-button quiet" onClick={() => void save({ ...post, status: post.status === "Published" ? "Draft" : "Published" })}>
            {post.status === "Published" ? "Unpublish" : "Publish"}
          </button>
          <button type="button" className="admin-button quiet" onClick={() => setEditing(post)}>Edit</button>
          <button type="button" className="admin-button danger" onClick={() => remove("blogs", post.id, "blog")}>Delete</button>
        </div>
      </div>)}
      {!matches.length && <p className="admin-panel">{posts.length ? "No blogs match these filters." : "Create a blog to publish it on the website."}</p>}
    </div>
  </>;
}
