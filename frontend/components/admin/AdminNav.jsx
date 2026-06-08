"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
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

  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-[var(--hw-border-subtle)] pb-3">
      {TABS.map((tab) => {
        const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              active
                ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
                : "border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)] hover:border-[var(--hw-orange)] hover:text-[var(--hw-text-primary)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
