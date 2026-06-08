"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/Context/LanguageContext";

const items = [
  ["nav.home", "/", "home"],
  ["common.search", "/vehicles", "search"],
  ["nav.post", "/post-ad", "post"],
  ["nav.parts", "/parts", "parts"],
  ["nav.account", "/auth/login", "account"],
];

function Icon({ type, active }) {
  const className = `h-5 w-5 ${active ? "text-[var(--hw-orange)]" : "text-[var(--hw-text-muted)]"}`;

  if (type === "home") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />
      </svg>
    );
  }

  if (type === "search") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (type === "post") {
    return (
      <svg className="h-6 w-6 text-[var(--hw-text-inverse)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (type === "parts") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a4 4 0 0 0-5 5L4 17v3h3l5.7-5.7a4 4 0 0 0 5-5l-2.4 2.4-3-3z" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (pathname.startsWith("/post-ad")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] shadow-2xl lg:hidden">
      <div className="grid h-16 grid-cols-5">
        {items.map(([key, href, type]) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const center = type === "post";
          const label = t(key);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 text-center"
              aria-label={label}
            >
              {center ? (
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--hw-orange)]">
                  <Icon type={type} active />
                </span>
              ) : (
                <Icon type={type} active={active} />
              )}
              <span className={`text-[10px] font-bold ${active ? "text-[var(--hw-orange)]" : "text-[var(--hw-text-muted)]"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
