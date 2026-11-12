import { contactLinks, dateLabel } from "../lib/content.mjs";
import { myths } from "../lib/seed.mjs";

const labels = {
  "Getting started": "A first step", "Fertility basics": "Fertility, simply",
  "Treatment options": "Care explained", "Myths & facts": "Myth & fact", Wellbeing: "A note to self",
};
const visualLabel = category => labels[category] || category;

export function ArticleCard({ article, index }) {
  return <article className="article-card">
    <a href={"/article/" + encodeURIComponent(article.id)} aria-label={"Read " + article.title}>
      <div className={"article-visual tone-" + (index % 3 + 1)}>
        <span className="visual-label">{visualLabel(article.category)}</span>
        <span className="visual-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="visual-shape" />
      </div>
      <div className="article-body">
        <div className="article-meta">{article.category}<span />{dateLabel(article.publishedAt)}</div>
        <h3>{article.title}</h3><p>{article.description}</p><span className="read-link">Read article →</span>
      </div>
    </a>
  </article>;
}

export function ArticleView({ article, related, index }) {
  const words = [article.intro, ...article.sections.flat()].join(" ").trim().split(/\s+/).length;
  return <main>
    <div className={"article-cover tone-" + (index % 3 + 1)}><span className="visual-label">{visualLabel(article.category)}</span><span className="visual-shape" /></div>
    <article className="article-reading">
      <a className="article-back" href="/blogs">← Back to the journal</a>
      <div className="article-meta" style={{ marginTop: 25 }}>{article.category}<span />{dateLabel(article.publishedAt)}<span />{Math.max(1, Math.ceil(words / 225))} min read</div>
      <h1>{article.title}</h1><p className="article-intro">{article.intro}</p>
      {article.sections.map(([heading, body], i) => <section key={i}><h2>{heading}</h2><p className="article-paragraph">{body}</p></section>)}
      <p>Every person’s experience is different. For guidance that considers your needs, speak with a qualified fertility clinician.</p>
    </article>
    {!!related.length && <section className="wrap related-section"><h2>Keep exploring</h2>
      <div className="article-grid">{related.map((item, i) => <ArticleCard key={item.id} article={item} index={i} />)}</div>
    </section>}
  </main>;
}

export function MythList() {
  return <div id="myths-all" className="myth-list myth-list-page">
    {myths.map(({ myth, fact, more }, i) => <details className="myth-card" key={myth}>
      <summary><span className="myth-number">{String(i + 1).padStart(2, "0")}</span><span>{myth}</span><span className="plus" aria-hidden="true">+</span></summary>
      <p><b>Fact:</b> {fact} {more}</p><a href="/appointment">Talk it through with our team →</a>
    </details>)}
  </div>;
}

export function ContactRibbon({ contact }) {
  const links = contactLinks(contact);
  return <section className="contact-ribbon"><div className="wrap contact-inner">
    <p>Whenever you’re ready, we’re here.</p>
    <a href={links.phone}><span className="contact-icon" aria-hidden="true">↗</span> {contact.phone}</a>
    <a href={links.whatsapp} target="_blank" rel="noreferrer"><span className="contact-icon" aria-hidden="true">◌</span> WhatsApp us</a>
    <a href={links.email}><span className="contact-icon" aria-hidden="true">✉</span> Send an email</a>
  </div></section>;
}

export function ContactLines({ contact }) {
  const links = contactLinks(contact);
  return <div className="contact-lines">
    <a href={links.phone}>↗ &nbsp; {contact.phone}</a>
    <a href={links.whatsapp} target="_blank" rel="noreferrer">◌ &nbsp; WhatsApp us</a>
    <a href={links.email}>✉ &nbsp; {contact.email}</a>
  </div>;
}
