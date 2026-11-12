"use client";

import { useState } from "react";
import { ArticleCard } from "./PublicContent";

export default function Journal({ articles }) {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const categories = [...new Set(articles.map(article => article.category))];
  const matches = articles.map((article, index) => ({ article, index })).filter(({ article }) =>
    (!category || article.category === category) &&
    [article.title, article.description, article.category].join(" ").toLowerCase().includes(query.trim().toLowerCase())
  );
  return <section className="wrap blog-listing">
    <div className="blog-tools">
      <label className="search-field"><span aria-hidden="true">⌕</span><input id="article-search" type="search" placeholder="Search articles" aria-label="Search articles" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <div className="category-filters" role="group" aria-label="Filter articles by category">
        {["", ...categories].map(value => <button className={"filter-chip" + (category === value ? " active" : "")}
          key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{value || "All"}</button>)}
      </div>
    </div>
    <div className="article-grid article-grid-list">{matches.map(({ article, index }) => <ArticleCard key={article.id} article={article} index={index} />)}</div>
    <p className="empty-search" role="status" hidden={matches.length > 0}>No articles match your search. Try another phrase.</p>
  </section>;
}
