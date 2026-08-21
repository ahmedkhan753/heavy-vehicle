"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useNotifications from "@/lib/useNotifications";
import { NotificationBadge } from "@/components/ui/NotificationBadge";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/dealers", label: "Dealers" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/ads", label: "Ads" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/upgrades", label: "Boosts" },
  { href: "/admin/commissions", label: "Commissions" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/inspectors", label: "Inspectors" },
  { href: "/admin/warranty", label: "Warranty" },
];

export default function AdminNav() {
  const pathname = usePathname();
  // Counts are keyed by tab href server-side, so a new tab only needs its
  // href adding in both places — no separate mapping table to keep in sync.
  const { counts, pendingListings, total } = useNotifications("admin");

  return (
    <nav className="mb-8 border-b border-[var(--hw-border-subtle)] pb-3">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
          // The overview tab stands in for listings stuck in moderation,
          // which have no tab of their own.
          const count = tab.href === "/admin" ? pendingListings : counts?.[tab.href] || 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative rounded-lg px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
                  : "border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)] hover:border-[var(--hw-orange)] hover:text-[var(--hw-text-primary)]"
              }`}
            >
              {tab.label}
              {count > 0 ? (
                <NotificationBadge count={count} className="absolute -end-1.5 -top-1.5 ring-[var(--hw-bg-deep)]" />
              ) : null}
            </Link>
          );
        })}
      </div>

      {total > 0 ? (
        <p className="mt-3 text-xs font-bold text-[var(--hw-text-muted)]">
          <span className="text-red-500">{total}</span> item{total === 1 ? "" : "s"} waiting on your review
        </p>
      ) : null}
    </nav>
  );
}
