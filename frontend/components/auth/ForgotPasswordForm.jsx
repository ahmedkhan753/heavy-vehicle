"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi, normalizeApiError } from "@/lib/api";
import { useLanguage } from "@/Context/LanguageContext";

export default function ForgotPasswordForm() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    try {
      const res = await authApi.forgotPassword({
        email: String(formData.get("email") || ""),
      });
      setSent(true);
      // Dev fallback: backend returns a ready link when email isn't configured.
      if (res?.devResetUrl) setDevUrl(res.devResetUrl);
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6">
      <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("auth.accountLabel")}</p>
      <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">{t("auth.forgotTitle")}</h1>
      <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">
        {t("auth.forgotSubtitle")}
      </p>

      {error ? (
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
          {error}
        </div>
      ) : null}

      {sent ? (
        <div className="mt-5 grid gap-3">
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm font-bold text-green-200">
            {t("auth.resetSentGeneric")}
          </div>
          {devUrl ? (
            <div className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-deep)] p-3 text-xs text-[var(--hw-text-secondary)]">
              <p className="mb-1 font-black text-[var(--hw-orange)]">DEV: email not configured — use this link:</p>
              <Link href={devUrl.replace(/^https?:\/\/[^/]+/, "")} className="break-all font-bold text-[var(--hw-text-primary)] underline">
                {devUrl}
              </Link>
            </div>
          ) : null}
          <Link href="/auth/login" className="text-center text-sm font-bold text-[var(--hw-orange)]">
            {t("auth.backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("auth.email")}
            <input
              name="email"
              type="email"
              required
              className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
              placeholder="seller@example.com"
            />
          </label>
          <button disabled={loading} className="mt-2 h-12 rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
            {loading ? t("auth.sending") : t("auth.sendResetLink")}
          </button>
          <Link href="/auth/login" className="text-center text-sm font-bold text-[var(--hw-orange)]">
            {t("auth.backToLogin")}
          </Link>
        </form>
      )}
    </section>
  );
}
