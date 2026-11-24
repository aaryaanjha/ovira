import { contactLinks, dateLabel } from "../lib/content.mjs";
import ResilientImage from "./ResilientImage";
import { mythGuideSlug, relatedAnchor } from "../lib/seo-content.mjs";

const labels = {
  "Getting started": "A first step", "Fertility basics": "Fertility, simply",
  "Treatment options": "Care explained", "Myths & facts": "Myth & fact", Wellbeing: "A note to self",
};
const visualLabel = category => labels[category] || category;

export function ArticleCard({ article, index }) {
  const hasFeaturedImage = Boolean(article.featuredImage);
  return <article className="article-card">
    <a href={"/article/" + encodeURIComponent(article.slug || article.id)} aria-label={"Read " + article.title}>
      <div className={"article-visual tone-" + (index % 3 + 1) + (hasFeaturedImage ? " has-featured-image" : "")}>
        {hasFeaturedImage ? <ResilientImage src={article.featuredImage} alt={article.title + " — OVIRA fertility guidance"} loading="lazy" /> : <>
          <span className="visual-label">{visualLabel(article.category)}</span>
          <span className="visual-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="visual-shape" />
        </>}
      </div>
      <div className="article-body">
        <div className="article-meta">{article.category}<span />{dateLabel(article.publishedAt)}</div>
        <h3>{article.title}</h3><p>{article.description}</p><span className="read-link">Read article →</span>
      </div>
    </a>
  </article>;
}

export function ArticleView({ article, related, guides = [], index }) {
  const words = [article.intro, ...article.sections.flat()].join(" ").trim().split(/\s+/).length;
  const hasFeaturedImage = Boolean(article.featuredImage);
  return <main>
    <div className={"article-cover tone-" + (index % 3 + 1) + (hasFeaturedImage ? " has-featured-image" : "")}>
      {hasFeaturedImage ? <ResilientImage src={article.featuredImage} alt={article.title + " — OVIRA fertility guidance"} loading="eager" fetchPriority="high" /> : <>
        <span className="visual-label">{visualLabel(article.category)}</span><span className="visual-shape" />
      </>}
    </div>
    <article className="article-reading">
      <nav className="article-breadcrumb" aria-label="Breadcrumb">
        <ol><li><a href="/">Home</a></li><li><a href="/blogs">Fertility articles</a></li><li aria-current="page">{article.title}</li></ol>
      </nav>
      <div className="article-meta" style={{ marginTop: 25 }}>{article.category}<span />{dateLabel(article.publishedAt)}<span />{Math.max(1, Math.ceil(words / 225))} min read</div>
      <h1>{article.title}</h1><p className="article-intro">{article.intro}</p>
      {article.sections.map(([heading, body], i) => <section key={i}><h2>{heading}</h2><p className="article-paragraph">{body}</p></section>)}
      <p>Every person’s experience is different. For guidance that considers your needs, speak with a qualified fertility clinician.</p>
      {guides.length > 0 && <nav className="article-next-steps" aria-label="Related fertility guides">
        <h2>Related fertility guides</h2>
        <ul>{guides.map(item => <li key={item.id}><a href={"/article/" + encodeURIComponent(item.slug || item.id)}>{relatedAnchor(item)}</a></li>)}</ul>
      </nav>}
      <nav className="article-next-steps" aria-label="Related fertility resources">
        <h2>Explore more fertility resources</h2>
        <ul><li><a href="/myths">Read IVF myths and facts</a></li><li><a href="/blogs">Browse fertility and IVF articles</a></li><li><a href="/appointment">Contact the OVIRA care team</a></li></ul>
      </nav>
    </article>
    {!!related.length && <section className="wrap related-section"><h2>Keep exploring</h2>
      <div className="article-grid">{related.filter(item => item.id !== article.id).map((item, i) => <ArticleCard key={item.id} article={item} index={i} />)}</div>
    </section>}
  </main>;
}

// Each myth links to the article that explains it in more depth. Links only render for published
// articles, so they can never be broken links.
export function MythPreview({ item, index, articles = [] }) {
  const slugs = new Set(articles.map(article => article.slug || article.id));
  const guideSlug = mythGuideSlug(item.myth, slugs);
  const guide = guideSlug && articles.find(article => (article.slug || article.id) === guideSlug);
  return <details className="myth-card myth-preview-card">
    <summary><span className="myth-number">{String(index + 1).padStart(2, "0")}</span><h3 className="myth-heading"><span className="myth-label">Myth</span>{item.myth}</h3><span className="plus" aria-hidden="true">+</span></summary>
    <p><b>Fact:</b> {item.fact}</p>
    {item.more && <p>{item.more}</p>}
    {guide && <a className="myth-guide-link" href={"/article/" + encodeURIComponent(guideSlug)}>Read the guide: {relatedAnchor(guide)} →</a>}
  </details>;
}

export function MythList({ items, articles = [] }) {
  return <div id="myths-all" className="myth-list myth-list-page">
    {items.map((item, index) => <MythPreview key={item.id} item={item} index={index} articles={articles} />)}
    {!items.length && <p className="empty-search">Myths &amp; Facts are being updated. Please check back soon.</p>}
  </div>;
}

// Keyword-led links to the core guides, used on the home and blog pages to spread internal links
// beyond the newest articles. Only published guides are listed.
const popularGuideSlugs = ["what-is-ivf", "ivf-treatment-process", "ivf-vs-iui", "pcos-and-infertility",
  "understanding-ovulation", "fertility-first-steps", "fertility-and-partners", "supporting-wellbeing"];
export function PopularGuides({ articles, heading = "Popular fertility guides" }) {
  const bySlug = new Map(articles.map(article => [article.slug || article.id, article]));
  const guides = popularGuideSlugs.map(slug => bySlug.get(slug)).filter(Boolean);
  if (!guides.length) return null;
  return <nav className="article-next-steps popular-guides" aria-label={heading}>
    <h2>{heading}</h2>
    <ul>{guides.map(item => <li key={item.id}><a href={"/article/" + encodeURIComponent(item.slug || item.id)}>{relatedAnchor(item)}</a></li>)}</ul>
  </nav>;
}

export function ContactRibbon({ contact }) {
  const links = contactLinks(contact);
  return <section className="contact-ribbon" aria-label="OVIRA contact details">
    <div className="contact-marquee">
      <div className="contact-marquee-track">
        <div className="contact-marquee-group">
          <p>Whenever you’re ready, we’re here.</p>
          <a href={links.phone}><span className="contact-icon" aria-hidden="true">↗</span>{contact.phone}</a>
          <a href={links.whatsapp} target="_blank" rel="nofollow noopener noreferrer"><span className="contact-icon" aria-hidden="true">◌</span>WhatsApp us</a>
          <a href={links.email}><span className="contact-icon" aria-hidden="true">✉</span>Send an email</a>
        </div>
        <div className="contact-marquee-group" aria-hidden="true">
          <p>Whenever you’re ready, we’re here.</p>
          <span><span className="contact-icon">↗</span>{contact.phone}</span>
          <span><span className="contact-icon">◌</span>WhatsApp us</span>
          <span><span className="contact-icon">✉</span>Send an email</span>
        </div>
      </div>
    </div>
  </section>;
}

export function ContactLines({ contact }) {
  const links = contactLinks(contact);
  return <div className="contact-lines">
    <a href={links.phone}>↗ &nbsp; {contact.phone}</a>
    <a href={links.whatsapp} target="_blank" rel="nofollow noopener noreferrer">◌ &nbsp; WhatsApp us</a>
    <a href={links.email}>✉ &nbsp; {contact.email}</a>
  </div>;
}
