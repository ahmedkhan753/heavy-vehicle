"use client";

/**
 * PlanPromoBanner
 * Persistent upsell shown to users WITHOUT an active subscription.
 * Rotates a few marketing messages so it stays fresh ("constant ads").
 * Only renders for authenticated, non-subscribed users.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { subscriptionApi } from "@/lib/api";

const MESSAGES = [
  { title: "Sell faster — feature your listing", body: "Featured trucks get seen first. Upgrade and reach serious buyers." },
  { title: "Free plan posts up to 5 ads", body: "Dealers on a plan get many more listings and longer payment grace." },
  { title: "Become a verified dealer", body: "Get a storefront, more featured slots, and buyer trust." },
];

export default function PlanPromoBanner() {
  const { isAuthenticated, user } = useAuth();
  const [show, setShow] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Admins don't need upselling.
    if (user?.role === "admin") return;
    subscriptionApi.me()
      .then((res) => setShow(!res?.data?.subscription))
      .catch(() => setShow(false));
  }, [isAuthenticated, user]);

  // Rotate the message every render cycle the banner is visible.
  useEffect(() => {
    if (!show) return undefined;
    const id = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 7000);
    return () => clearInterval(id);
  }, [show]);

  if (!show) return null;
  const msg = MESSAGES[idx];

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[var(--hw-orange)] bg-[var(--hw-soft-panel)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-black text-[var(--hw-text-primary)]">🚀 {msg.title}</p>
        <p className="mt-0.5 text-sm text-[var(--hw-text-secondary)]">{msg.body}</p>
      </div>
      <Link
        href="/dashboard/billing"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)]"
      >
        View plans
      </Link>
    </div>
  );
}
