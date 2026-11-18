import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap page-hero" aria-labelledby="not-found-title">
      <p className="eyebrow">Page not found</p>
      <h1 id="not-found-title">Let&apos;s help you find<br /><em>the right next step.</em></h1>
      <p>The page may have moved or the address may be incorrect.</p>
      <div className="hero-actions" style={{ justifyContent: "center", marginTop: "28px" }}>
        <Link className="button button-primary" href="/">Return home</Link>
        <Link className="text-link" href="/appointment">Contact our care team</Link>
      </div>
    </main>
  );
}
