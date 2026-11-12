"use client";

import { useEffect, useState } from "react";

const slides = [
  ["ivf-consultation", "Fertility specialist listening to a couple during a consultation", "Care that begins by listening"],
  ["ivf-lab", "Embryologist working carefully in a modern IVF laboratory", "Science guided by care"],
  ["ivf-guidance", "Fertility specialist reviewing personalized care options with a patient", "Your journey, your next step"],
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(motion.matches);
    change();
    motion.addEventListener("change", change);
    return () => motion.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    if (paused || reduced || hover || focus) return;
    const timer = setInterval(() => setCurrent(index => (index + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [paused, reduced, hover, focus]);

  const move = offset => setCurrent(index => (index + slides.length + offset) % slides.length);
  return <div className="hero-art hero-slider" role="region" aria-label="OVIRA fertility care photo stories"
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onFocus={() => setFocus(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false); }}>
    <div className="hero-slides">{slides.map(([image, alt, caption], index) =>
      <figure key={image} className={"hero-slide" + (index === current ? " is-active" : "")} aria-hidden={index !== current}>
        <img src={"/assets/" + image + ".webp"} alt={alt} fetchPriority={index === 0 ? "high" : "low"} />
        <figcaption><span>0{index + 1} / 03</span><b>{caption}</b></figcaption>
      </figure>)}</div>
    <div className="slider-controls">
      <button className="slider-arrow" type="button" aria-label={paused ? "Resume slideshow" : "Pause slideshow"} onClick={() => setPaused(value => !value)}>{paused ? "▶" : "Ⅱ"}</button>
      <button className="slider-arrow slider-prev" type="button" aria-label="Previous photo" onClick={() => move(-1)}>←</button>
      <div className="slider-dots" role="group" aria-label="Choose a photo">
        {slides.map(([image], index) => <button key={image} className={"slider-dot" + (index === current ? " is-active" : "")}
          type="button" aria-label={"Show photo " + (index + 1)} aria-current={index === current || undefined} onClick={() => setCurrent(index)} />)}
      </div>
      <button className="slider-arrow slider-next" type="button" aria-label="Next photo" onClick={() => move(1)}>→</button>
    </div>
  </div>;
}
