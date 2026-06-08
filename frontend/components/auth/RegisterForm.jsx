"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { normalizeApiError } from "@/lib/api";
import { CITIES } from "@/lib/constants";
import PasswordHints, { isStrongPassword } from "@/components/auth/PasswordHints";
import SuggestInput from "@/components/ui/SuggestInput";

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);
  const [password, setPassword] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setFieldErrors([]);

    // Instant feedback before hitting the API.
    if (!isStrongPassword(password)) {
      const msg = "Please choose a stronger password (8+ chars with uppercase, lowercase, and a number).";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    try {
      await register({
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        password: String(formData.get("password") || ""),
        role: String(formData.get("role") || "user"),
        city: String(formData.get("city") || ""),
        address: String(formData.get("address") || ""),
      });
      toast.success(t("auth.createAccount"));
      router.push("/dashboard");
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
      // Surface per-field validation messages from the API (422).
      const details = err?.errors || err?.raw?.errors || [];
      setFieldErrors(Array.isArray(details) ? details : []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-2xl rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6">
      <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("auth.accountLabel")}</p>
      <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">{t("auth.registerTitle")}</h1>
      <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">{t("auth.registerSubtitle")}</p>

      {error ? (
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">
          {error}
          {fieldErrors.length ? (
            <ul className="mt-2 list-disc pl-5 font-normal">
              {fieldErrors.map((fe, i) => (
                <li key={i}>{fe.field ? `${fe.field}: ` : ""}{fe.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          {t("auth.name")}
          <input name="name" required minLength={2} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          {t("auth.phone")}
          <input name="phone" required placeholder="03001234567" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          {t("auth.email")}
          <input name="email" type="email" required className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          {t("auth.role")}
          <select name="role" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-secondary)] outline-none focus:border-[var(--hw-orange)]">
            <option value="user">{t("auth.roleUser")}</option>
            <option value="dealer">{t("auth.roleDealer")}</option>
          </select>
        </label>
        <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
          <SuggestInput name="city" label={t("auth.city")} options={CITIES} required placeholder="e.g. Karachi, Sahiwal" />
          <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {t("auth.address")}<span className="text-[var(--hw-red)]" aria-hidden="true"> *</span>
            <input name="address" required minLength={5} maxLength={200} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" placeholder="Street / area, city" />
          </label>
        </div>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)] sm:col-span-2">
          {t("auth.password")}
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
        <button disabled={loading} className="mt-2 h-12 rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60 sm:col-span-2">
          {loading ? t("auth.creating") : t("auth.createAccount")}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--hw-text-secondary)]">
        {t("auth.haveAccount")} <Link href="/auth/login" className="font-bold text-[var(--hw-orange)]">{t("auth.login")}</Link>
      </p>
    </section>
  );
}
