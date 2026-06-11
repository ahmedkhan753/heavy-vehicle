"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { paymentApi, normalizeApiError } from "@/lib/api";
import { useLanguage } from "@/Context/LanguageContext";

// Poll the payment status a few times — the webhook usually confirms within a
// second or two, and getStatus also does a server-side re-check as a fallback.
const MAX_POLLS = 6;
const INTERVAL_MS = 2000;

export default function PaymentCallback() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId") || "";
  const cancelled = searchParams.get("payment") === "cancelled";

  const [state, setState] = useState(cancelled ? "cancelled" : paymentId ? "checking" : "missing");
  const [type, setType] = useState("");

  useEffect(() => {
    if (state !== "checking" || !paymentId) return;
    let active = true;
    let attempt = 0;

    async function poll() {
      attempt += 1;
      try {
        const res = await paymentApi.status(paymentId);
        if (!active) return;
        setType(res?.data?.type || "");
        const status = res?.data?.status;
        if (status === "verified") return setState("success");
        if (status === "failed" || status === "rejected") return setState("failed");
        if (attempt >= MAX_POLLS) return setState("pending");
        setTimeout(poll, INTERVAL_MS);
      } catch (err) {
        if (!active) return;
        // Surface nothing noisy; just stop polling and show the pending state.
        void normalizeApiError(err.payload || err);
        if (attempt >= MAX_POLLS) return setState("pending");
        setTimeout(poll, INTERVAL_MS);
      }
    }

    poll();
    return () => {
      active = false;
    };
  }, [state, paymentId]);

  // Where "View" sends the user, based on what they paid for.
  const successHref = type === "subscription" ? "/dashboard/billing" : "/dashboard/my-ads";

  const VIEWS = {
    checking: {
      icon: "⏳",
      tone: "var(--hw-amber)",
      title: t("pay.checkingTitle"),
      body: t("pay.checkingBody"),
      cta: null,
    },
    success: {
      icon: "✅",
      tone: "var(--hw-green)",
      title: t("pay.successTitle"),
      body: type === "subscription" ? t("pay.successSub") : t("pay.successBoost"),
      cta: { href: successHref, label: t("pay.goDashboard") },
    },
    pending: {
      icon: "🕓",
      tone: "var(--hw-amber)",
      title: t("pay.pendingTitle"),
      body: t("pay.pendingBody"),
      cta: { href: "/dashboard/billing", label: t("pay.backBilling") },
    },
    failed: {
      icon: "❌",
      tone: "#ef4444",
      title: t("pay.failedTitle"),
      body: t("pay.failedBody"),
      cta: { href: "/dashboard/billing", label: t("pay.tryAgain") },
    },
    cancelled: {
      icon: "↩️",
      tone: "var(--hw-text-muted)",
      title: t("pay.cancelledTitle"),
      body: t("pay.cancelledBody"),
      cta: { href: "/dashboard/billing", label: t("pay.backBilling") },
    },
    missing: {
      icon: "❓",
      tone: "var(--hw-text-muted)",
      title: t("pay.missingTitle"),
      body: t("pay.missingBody"),
      cta: { href: "/dashboard/billing", label: t("pay.goBilling") },
    },
  };

  const view = VIEWS[state] || VIEWS.missing;

  return (
    <section className="w-full max-w-md rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
      <div className="text-5xl" style={{ color: view.tone }}>{view.icon}</div>
      <h1 className="mt-4 text-2xl font-black text-[var(--hw-text-primary)]">{view.title}</h1>
      <p className="mt-3 text-sm text-[var(--hw-text-secondary)]">{view.body}</p>
      {view.cta ? (
        <Link
          href={view.cta.href}
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-6 text-sm font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)]"
        >
          {view.cta.label}
        </Link>
      ) : null}
    </section>
  );
}
