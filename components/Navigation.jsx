"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const links = [["Home", "/"], ["Myths & Facts", "/myths"], ["Blogs", "/blogs"], ["Testimonials", "/#testimonials"], ["About", "/#about"], ["Contact Us", "/appointment"]];

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return <>
    <button className="menu-toggle" type="button" aria-label={open ? "Close navigation" : "Open navigation"}
      aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)}>{open ? "×" : "☰"}</button>
    <nav id="public-navigation" className={"nav-links" + (open ? " open" : "")} aria-label="Main navigation"
      onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
      {links.map(([label, href]) => <a key={href} href={href} aria-current={path === href ? "page" : undefined}
        onClick={() => setOpen(false)}>{label}</a>)}
    </nav>
  </>;
}
