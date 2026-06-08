"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi, normalizeApiError } from "@/lib/api";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import PasswordHints, { isStrongPassword } from "@/components/auth/PasswordHints";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { t } = useLanguage();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const confirm = String(formData.get("confirm") || "");

    if (!isStrongPassword(password)) {
      const msg = "Please choose a stronger password (8+ chars with uppercase, lowercase, and a number).";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirm) {
      setError(t("auth.passwordsNoMatch"));
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      toast.success(t("auth.resetPassword"));
      router.push("/auth/login");
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6">
      <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("auth.accountLabel")}</p>
      <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">{t("auth.resetTitle")}</h1>
      <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">
        {t("auth.resetSubtitle")}
      </p>

      {error ? (
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
          {error}
        </div>
      ) : null}

      {!token ? (
        <div className="mt-5 grid gap-3">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
            This reset link is missing its token. Please request a new one.
          </div>
          <Link href="/auth/forgot-password" className="text-center text-sm font-bold text-[var(--hw-orange)]">
            {t("auth.forgotTitle")}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("auth.newPassword")}
            <input
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
              placeholder="••••••••"
            />
            <PasswordHints value={password} />
          </label>
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("auth.confirmPassword")}
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
              className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
              placeholder="••••••••"
            />
          </label>
          <button disabled={loading} className="mt-2 h-12 rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
            {loading ? t("auth.resetting") : t("auth.resetPassword")}
          </button>
        </form>
      )}
    </section>
  );
}
