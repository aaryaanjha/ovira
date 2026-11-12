import Navigation from "./Navigation";

export default function SiteHeader() {
  return (
    <header className="site-header"><div className="wrap nav-wrap"><a className="brand" href="/" aria-label="OVIRA home"><span className="brand-mark"><img src="/assets/ovira-mark.webp" alt="" /></span><span className="brand-word">OVIRA<small>CARE WITH HEART</small></span></a><Navigation /><a className="button button-primary nav-cta" href="/appointment">Book an appointment <span>↗</span></a></div></header>
  );
}
