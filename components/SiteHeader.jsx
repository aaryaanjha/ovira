import Navigation from "./Navigation";

export default function SiteHeader() {
  return (
    <header className="site-header"><div className="wrap nav-wrap"><a className="brand" href="/" aria-label="OVIRA home"><span className="brand-mark"><img src="/assets/ovira-logo.png" alt="" width="40" height="40" /></span><span className="brand-word">OVIRA<small>Life Begins Here</small></span></a><Navigation /><a className="button button-primary nav-cta" href="/appointment">Book an appointment <span aria-hidden="true">↗</span></a></div></header>
  );
}
