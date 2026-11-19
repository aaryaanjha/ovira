import IVFCycle from "../../components/IVFCycle";
import { ArticleCard, ContactRibbon, MythPreview } from "../../components/PublicContent";
import { publicArticles, publicContact, publicMyths, publicSlides, publicTestimonials } from "../../lib/store.mjs";
import { pageMetadata } from "../../lib/seo.mjs";

export const metadata = pageMetadata({
  title: "Fertility Care & IVF Guidance",
  description: "Explore compassionate fertility information, IVF guidance, and clear answers to common questions from OVIRA.",
  path: "/",
});

export default async function Home() {
  const [articles, contact, myths, slides, testimonials] = await Promise.all([
    publicArticles(), publicContact(), publicMyths(), publicSlides(), publicTestimonials(),
  ]);
  const heroSlide = slides[0] || {
    image: "/assets/ivf-consultation.webp",
    alt: "Fertility specialist listening during a consultation",
    caption: "Care that begins by listening",
  };
  const wellbeingArticle = articles.find(article => article.id === "supporting-wellbeing");
  return (
    <main>
      <section className="hero wrap" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Fertility care, made personal</p>
          <h1>Fertility care<br />that starts with <em>you.</em></h1>
          <p className="hero-lead">Clear fertility information, thoughtful science, and support for your next conversation.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/appointment">Contact our care team <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="/myths">Explore fertility facts <span aria-hidden="true">→</span></a>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true"><span>✦</span><span>♡</span><span>✿</span></div>
            <p><strong>A little more hope, a lot more support.</strong><br />Care that starts by listening.</p>
          </div>
        </div>
        <figure className="hero-art hero-feature">
          <img className="hero-photo" src={heroSlide.image} alt={heroSlide.alt} width="1200" height="900"
            loading="eager" fetchPriority="high" decoding="async" />
          <figcaption>{heroSlide.caption}</figcaption>
        </figure>
      </section>

      <ContactRibbon contact={contact} />

      <section className="section wrap myths-preview" id="myths">
        <div className="section-intro">
          <p className="eyebrow">Myths &amp; Facts</p>
          <h2>Let’s make room<br />for <em>the facts.</em></h2>
          <p>There’s a lot of fertility advice out there. We’re here to help you find what’s helpful, what’s not, and what to ask next.</p>
          <a className="text-link" href="/myths">Browse all fertility facts <span aria-hidden="true">→</span></a>
        </div>
        <div className="myth-list">
          {myths.slice(0, 3).map((item, index) => <MythPreview key={item.id} item={item} index={index} />)}
          {!myths.length && <p className="empty-search">Myths &amp; Facts are being updated. Please check back soon.</p>}
        </div>
      </section>

      <section className="section section-soft">
        <div className="wrap">
          <div className="section-heading-row">
            <div><p className="eyebrow">Blogs</p><h2>Fertility insights<br />worth <em>keeping.</em></h2></div>
            <a className="text-link" href="/blogs">Visit the blogs <span aria-hidden="true">→</span></a>
          </div>
          <div id="featured-articles" className="article-grid article-grid-featured">
            {articles.slice(0, 4).map((article, index) => <ArticleCard key={article.id} article={article} index={index} />)}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && <section className="section wrap testimonials" id="testimonials">
        <div className="testimonial-heading">
          <p className="eyebrow">Testimonials</p>
          <h2>Care that stays<br />with <em>you.</em></h2>
          <p>Every journey is personal. We’re grateful to be trusted with the moments that matter.</p>
        </div>
        <div className="testimonial-quotes">
          {testimonials.map(testimonial => <article className="quote-card" key={testimonial.id}>
            <div className="quote-mark" aria-hidden="true">“</div>
            <blockquote>{testimonial.content}</blockquote>
            <div className="quote-by">
              {testimonial.profileImage ? <img className="quote-avatar" src={testimonial.profileImage} alt="" /> : <span className="quote-avatar" aria-hidden="true">{testimonial.name.slice(0, 1)}</span>}
              <div><b>{testimonial.name}</b>{testimonial.details && <small>{testimonial.details}</small>}</div>
              {testimonial.rating && <span className="quote-stars" aria-label={testimonial.rating + " out of 5 stars"}>{"★".repeat(testimonial.rating)}</span>}
            </div>
          </article>)}
        </div>
      </section>}

      <section className="section about-section" id="about">
        <div className="wrap about-grid">
          <div className="about-stamp">
            <IVFCycle />
          </div>
          <div className="about-copy">
            <p className="eyebrow">A better kind of care</p>
            <h2>Fertility information<br />with <em>a human touch.</em></h2>
            <p>We believe fertility conversations should begin with listening, clear explanations, and respect. Our resources aim to help you prepare questions and understand general topics.</p>
            <div className="value-list">
              <div><span>01</span><p><b>Compassion, first</b><small>Your questions and feelings belong in the room.</small></p></div>
              <div><span>02</span><p><b>Clear information</b><small>Plain-language explanations of common topics.</small></p></div>
              <div><span>03</span><p><b>One step at a time</b><small>Use each resource to prepare for your next conversation.</small></p></div>
            </div>
            <a className="button button-outline" href="/appointment">Ask the care team a question <span aria-hidden="true">→</span></a>
            {wellbeingArticle && <p><a className="text-link" href={"/article/" + encodeURIComponent(wellbeingArticle.slug || wellbeingArticle.id)}>Read about supporting your wellbeing <span aria-hidden="true">→</span></a></p>}
          </div>
        </div>
      </section>

      <section className="mission-section">
        <div className="wrap mission-grid">
          <div><p className="eyebrow">Our vision</p><h2>A future where<br />more people can<br /><em>begin with hope.</em></h2></div>
          <div className="mission-card">
            <span className="mission-icon" aria-hidden="true">✳</span>
            <p className="eyebrow">Our mission</p>
            <p>To make fertility information easier to navigate through clear explanations and compassionate support.</p>
            <a href="/appointment">Let’s talk about your next step <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="wrap closing-inner">
          <div><p className="eyebrow">You don’t have to have it all figured out</p><h2>Start with a<br /><em>conversation.</em></h2></div>
          <a className="button button-light" href="/appointment">Get in touch with OVIRA <span aria-hidden="true">↗</span></a>
          <div className="closing-flower" aria-hidden="true">✿</div>
        </div>
      </section>
    </main>
  );
}
