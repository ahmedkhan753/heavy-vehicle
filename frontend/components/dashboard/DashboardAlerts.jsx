"use client";

import Link from "next/link";
import { useLanguage } from "@/Context/LanguageContext";

/**
 * The dated warnings that don't fit a numeric badge — a plan about to
 * lapse, a commission coming due, ads about to expire. These are the ones
 * where *missing* the date costs the user something, so they get a full
 * clickable row explaining what's wrong and where to fix it, rather than a
 * bare number they'd have to go interpret.
 *
 * The backend sends a translation key plus its numbers rather than a
 * finished sentence, so the wording follows the user's language rather
 * than whatever the server happened to be set to.
 */

const SEVERITY = {
  critical: {
    wrap: "border-red-500/40 bg-red-500/10",
    mark: "bg-red-600 text-white",
    text: "text-red-200",
  },
  warning: {
    wrap: "border-[var(--hw-amber)]/40 bg-[var(--hw-amber)]/10",
    mark: "bg-[var(--hw-amber)] text-black",
    text: "text-[var(--hw-text-primary)]",
  },
};

// Minimal placeholder fill — the shared translate() has no interpolation
// and doesn't need it for anything else yet.
function fill(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (_, name) =>
    values[name] === undefined ? `{${name}}` : String(values[name])
  );
}

export default function DashboardAlerts({ alerts, compact = false }) {
  const { t } = useLanguage();
  if (!alerts?.length) return null;

  return (
    <div className={`grid gap-2 ${compact ? "" : "mt-4"}`}>
      {alerts.map((alert) => {
        const tone = SEVERITY[alert.severity] || SEVERITY.warning;
        return (
          <Link
            key={alert.id}
            href={alert.href}
            className={`flex items-start gap-2.5 rounded-lg border p-2.5 transition hover:brightness-110 ${tone.wrap}`}
          >
            <span
              aria-hidden
              className={`mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-black leading-none ${tone.mark}`}
            >
              !
            </span>
            <span className={`text-[12px] font-bold leading-5 ${tone.text}`}>
              {fill(t(alert.key), { n: alert.count, days: alert.days, plan: alert.plan })}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
