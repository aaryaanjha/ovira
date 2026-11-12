"use client";

import { useRef, useState } from "react";

export default function AppointmentForm() {
  const [method, setMethod] = useState("Phone");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const id = useRef("");
  const saving = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (saving.current || status === "success") return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = "Please enter your name.";
    if (!/^\+?[\d ().-]+$/.test(values.phone) || !/^\d{10,15}$/.test(values.phone.replace(/\D/g, ""))) nextErrors.phone = "Please enter a valid phone number.";
    if ((values.email || method === "Email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = "Please enter a valid email address.";
    if (!values.consent) nextErrors.consent = "Please agree to the Terms and Privacy Policy to continue.";
    setErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length) {
      form.elements.namedItem(Object.keys(nextErrors)[0]).focus();
      return;
    }
    saving.current = true;
    setStatus("pending");
    try {
      id.current ||= crypto.randomUUID();
      const response = await fetch("/api/appointments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, consent: Boolean(values.consent), id: id.current }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Please try again.");
      setStatus("success");
      form.reset();
      setMethod("Phone");
    } catch (error) {
      setStatus("");
      setError(error.message === "Failed to fetch" ? "Please check your connection and try again." : error.message);
    } finally {
      saving.current = false;
    }
  }

  function field(name, label, attrs) {
    return <label className={"field" + (errors[name] ? " invalid" : "")}>{label} {attrs.required ? <span className="required">*</span> : <span className="optional">Optional</span>}
      <input name={name} {...attrs} aria-invalid={Boolean(errors[name])} aria-describedby={name + "-error"} />
      <span id={name + "-error"} className="field-error" aria-live="polite">{errors[name]}</span>
    </label>;
  }

  return <form id="appointment-form" className="appointment-form" method="post" action="/api/appointments" noValidate onSubmit={submit}
    onChange={event => { const name = event.target.name; if (errors[name]) setErrors(current => ({ ...current, [name]: undefined })); }}>
    <div className="form-heading"><span className="eyebrow">Book your appointment</span><h2>How can we reach you?</h2>
      <p>Fields marked <span className="required">*</span> are required.</p></div>
    <fieldset className="appointment-fields" disabled={status === "pending" || status === "success"}>
      <div className="form-grid">
        {field("name", "Full name", { autoComplete: "name", required: true, maxLength: 120, placeholder: "Your full name" })}
        {field("phone", "Phone number", { type: "tel", autoComplete: "tel", required: true, maxLength: 40, placeholder: "+91 00000 00000" })}
        <label className="field full-field">Address <span className="optional">Optional</span><textarea name="address" autoComplete="address-level2" rows={2} maxLength={250} placeholder="City or area is enough to start" /></label>
        {field("email", "Email address", { type: "email", autoComplete: "email", required: method === "Email", maxLength: 254, placeholder: "you@example.com" })}
        <label className="field">Preferred contact <span className="optional">Optional</span>
          <select name="contact" value={method} onChange={event => setMethod(event.target.value)}>
            <option value="Phone">Phone call</option><option>WhatsApp</option><option>Email</option>
          </select>
        </label>
        <label className="field full-field">Anything you’d like us to know? <span className="optional">Optional</span>
          <textarea name="message" rows={3} maxLength={1000} placeholder="Share a question or let us know a good time to call." aria-describedby="message-note" />
          <small id="message-note">Please leave out medical information.</small>
        </label>
      </div>
      <div className="form-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="consent"><input type="checkbox" name="consent" required aria-invalid={Boolean(errors.consent)} aria-describedby="consent-error" />
        <span>I agree to the <a href="/terms">Terms &amp; Conditions</a> and <a href="/privacy">Privacy Policy</a>.</span>
      </label>
      <p id="consent-error" className="consent-error" aria-live="polite">{errors.consent}</p>
      <button type="submit" className="button button-primary submit-button">{status === "pending" ? "Sending…" : status === "success" ? "Request received ✓" : "Send appointment request ↗"}</button>
    </fieldset>
    <div id="form-status" className={"form-status " + (status === "success" ? "success" : error ? "form-failure" : "")} role="status" aria-live="polite">
      {status === "success" ? "Thank you. Your appointment request has been received. Our team will get in touch with you shortly." : error}
    </div>
  </form>;
}
