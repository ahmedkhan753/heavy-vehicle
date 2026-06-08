"use client";

import { useState } from "react";
import { useToast } from "@/Context/ToastContext";
import { inspectorApi, normalizeApiError } from "@/lib/api";

const inputClass =
  "mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]";
const labelClass = "text-sm font-bold text-[var(--hw-text-secondary)]";

export default function PartnershipForm() {
  const toast = useToast();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSending(true);
    const fd = new FormData(event.currentTarget);
    try {
      await inspectorApi.partner({
        name: String(fd.get("name") || ""),
        company: String(fd.get("company") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        city: String(fd.get("city") || ""),
        message: String(fd.get("message") || ""),
      });
      setDone(true);
      toast.success("Thanks! We'll be in touch.");
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-[var(--hw-green)] bg-[var(--hw-bg-card)] p-8 text-center">
        <div className="text-4xl">🤝</div>
        <h3 className="mt-3 text-xl font-black text-[var(--hw-text-primary)]">Thanks for reaching out!</h3>
        <p className="mt-2 text-[var(--hw-text-secondary)]">Our team will contact you about partnering on inspections.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
      {error ? <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>Your name
          <input name="name" required className={inputClass} />
        </label>
        <label className={labelClass}>Company
          <input name="company" className={inputClass} />
        </label>
        <label className={labelClass}>Email
          <input name="email" type="email" required className={inputClass} />
        </label>
        <label className={labelClass}>Phone
          <input name="phone" className={inputClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>Message
          <textarea name="message" required minLength={5} maxLength={1500} placeholder="Tell us about your inspection company and coverage…" className="mt-2 min-h-28 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
      </div>
      <button disabled={sending} className="mt-6 h-12 w-full rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
        {sending ? "Sending…" : "Contact us about partnership"}
      </button>
    </form>
  );
}
