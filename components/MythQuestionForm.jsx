"use client";

import { useRef, useState } from "react";

export default function MythQuestionForm({ available = true }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const id = useRef("");
  const saving = useRef(false);

  if (!available) {
    return <section className="myth-question">
      <div className="myth-question-cta">
        <div><p className="eyebrow">Still have questions?</p><h2>Our question form is temporarily unavailable.</h2></div>
        <a className="button button-primary" href="/appointment">Contact the care team <span aria-hidden="true">↗</span></a>
      </div>
    </section>;
  }

  async function submit(event) {
    event.preventDefault();
    if (saving.current || status === "success") return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = "Please enter your name.";
    if (!/^\+?[\d ().-]+$/.test(values.phone) || !/^\d{10,15}$/.test(values.phone.replace(/\D/g, ""))) {
      nextErrors.phone = "Please enter a valid mobile number.";
    }
    if (!values.question.trim()) nextErrors.question = "Please enter your question.";
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id.current,
          name: values.name,
          phone: values.phone,
          contact: "Phone",
          message: values.question,
          consent: Boolean(values.consent),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Please try again.");
      setStatus("success");
      form.reset();
    } catch (submitError) {
      setStatus("");
      setError(submitError.message === "Failed to fetch"
        ? "Please check your connection and try again."
        : submitError.message);
    } finally {
      saving.current = false;
    }
  }

  return <section className="myth-question">
    <div className="myth-question-cta">
      <div><p className="eyebrow">Still have questions?</p><h2>We’re here to help you find clarity.</h2></div>
      <button className="button button-primary" type="button" aria-expanded={open} aria-controls="myth-question-form"
        onClick={() => setOpen(current => !current)}>
        {open ? "Close form" : "Ask your question"} <span aria-hidden="true">{open ? "−" : "↗"}</span>
      </button>
    </div>
    {open && <form id="myth-question-form" className="appointment-form myth-question-form" noValidate onSubmit={submit}
      onChange={event => {
        const name = event.target.name;
        if (errors[name]) setErrors(current => ({ ...current, [name]: undefined }));
      }}>
      <div className="form-heading"><h2>Ask us anything</h2><p>Share your question and our care team will get in touch.</p></div>
      <fieldset disabled={status === "pending" || status === "success"}>
        <div className="form-grid">
          <label className={"field" + (errors.name ? " invalid" : "")}>Name <span className="required">*</span>
            <input name="name" autoComplete="name" required maxLength={120} placeholder="Your name" aria-invalid={Boolean(errors.name)} aria-describedby="question-name-error" />
            <span id="question-name-error" className="field-error" aria-live="polite">{errors.name}</span>
          </label>
          <label className={"field" + (errors.phone ? " invalid" : "")}>Mobile number <span className="required">*</span>
            <input name="phone" type="tel" autoComplete="tel" required maxLength={40} placeholder="+91 00000 00000" aria-invalid={Boolean(errors.phone)} aria-describedby="question-phone-error" />
            <span id="question-phone-error" className="field-error" aria-live="polite">{errors.phone}</span>
          </label>
          <label className={"field full-field" + (errors.question ? " invalid" : "")}>Your question <span className="required">*</span>
            <textarea name="question" rows={4} maxLength={1000} required placeholder="What would you like to know?" aria-invalid={Boolean(errors.question)} aria-describedby="question-text-error" />
            <span id="question-text-error" className="field-error" aria-live="polite">{errors.question}</span>
          </label>
        </div>
        <label className="consent"><input type="checkbox" name="consent" required aria-invalid={Boolean(errors.consent)} aria-describedby="question-consent-error" />
          <span>By submitting, I agree to the <a href="/terms">Terms &amp; Conditions</a> and <a href="/privacy">Privacy Policy</a>.</span>
        </label>
        <p id="question-consent-error" className="consent-error" aria-live="polite">{errors.consent}</p>
        <button type="submit" className="button button-primary submit-button">
          {status === "pending" ? "Sending…" : status === "success" ? "Question sent ✓" : "Send your question ↗"}
        </button>
      </fieldset>
      <div className={"form-status " + (status === "success" ? "success" : error ? "form-failure" : "")} role="status" aria-live="polite">
        {status === "success" ? "Thank you. Your question has been received, and our team will be in touch." : error}
      </div>
    </form>}
  </section>;
}
