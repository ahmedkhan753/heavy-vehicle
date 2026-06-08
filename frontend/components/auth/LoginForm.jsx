"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";
import { normalizeApiError } from "@/lib/api";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const toast = useToast();
  const { t, lang, setLang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    try {
      await login({
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
      });
      toast.success("Logged in successfully");
      router.push(searchParams.get("redirect") || "/dashboard");
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6">
      <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("auth.accountLabel")}</p>
      <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">{t("auth.loginTitle")}</h1>
      <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">{t("auth.loginSubtitle")}</p>

      <div className="mt-5">
        <p className="text-xs font-bold text-[var(--hw-text-muted)]">{t("auth.chooseLanguage")}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {LANGUAGES.map((option) => {
            const selected = lang === option.code;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setLang(option.code)}
                className={`h-11 rounded-lg border text-sm font-black transition ${
                  selected
                    ? "border-[var(--hw-orange)] bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
                    : "border-[var(--hw-border-default)] text-[var(--hw-text-secondary)] hover:border-[var(--hw-orange)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[var(--hw-text-muted)]">{t("auth.languageHint")}</p>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          {t("auth.email")}
          <input name="email" type="email" required className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" placeholder="seller@example.com" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          {t("auth.password")}
          <input name="password" type="password" required className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" placeholder="••••••••" />
        </label>
        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-sm font-bold text-[var(--hw-orange)]">
            {t("auth.forgotPassword")}
          </Link>
        </div>
        <button disabled={loading} className="mt-2 h-12 rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
          {loading ? t("auth.loggingIn") : t("auth.login")}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--hw-text-secondary)]">
        {t("auth.newSeller")} <Link href="/auth/register" className="font-bold text-[var(--hw-orange)]">{t("auth.createAccount")}</Link>
      </p>
    </section>
  );
}
