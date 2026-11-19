const stages = [
  { title: "Ovarian stimulation", label: "Stimulation" },
  { title: "Egg retrieval", label: "Egg retrieval" },
  { title: "Fertilisation", label: "Fertilisation" },
  { title: "Embryo development", label: "Embryo growth" },
  { title: "Embryo transfer", label: "Transfer" },
  { title: "Pregnancy test", label: "Pregnancy test" },
];

export default function IVFCycle() {
  return <div className="ivf-cycle-mini" role="group" aria-label="Animated overview of common IVF stages">
    <div className="ivf-cycle-mini-orbit" aria-hidden="true" />
    <div className="ivf-cycle-mini-center">
      <img src="/assets/ovira-logo.png" alt="" width="66" height="66" />
      <p>OVIRA</p>
    </div>
    <ol className="ivf-cycle-mini-steps" aria-label="Typical stages of IVF">
      {stages.map((stage, index) => <li className={"ivf-cycle-mini-step ivf-cycle-mini-step-" + (index + 1)}
        key={stage.title} style={{ "--step-order": index }} aria-label={stage.title}>
        <span className="ivf-cycle-mini-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="ivf-cycle-mini-label">{stage.label}</span>
      </li>)}
    </ol>
  </div>;
}
