"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/Context/AuthContext";
import { useLanguage } from "@/Context/LanguageContext";

/* ── Inline icons (no icon lib installed) ───────────────────────── */
const Icon = ({ d, className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d}
  </svg>
);
const icons = {
  overview: <Icon d={<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>} />,
  ads: <Icon d={<><path d="M3 7h18M3 12h18M3 17h12" /></>} />,
  saved: <Icon d={<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />} />,
  profile: <Icon d={<><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>} />,
  dealer: <Icon d={<><path d="M3 9l1-5h16l1 5" /><path d="M4 9v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><path d="M9 19v-5h6v5" /></>} />,
  billing: <Icon d={<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>} />,
  commissions: <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2A2.5 2.5 0 0 1 9.5 15M12 6v12" /></>} />,
  purchases: <Icon d={<><path d="M5 7h14l-1 13H6z" /><path d="M9 7a3 3 0 0 1 6 0" /></>} />,
  post: <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>} />,
  requests: <Icon d={<><path d="M9 4h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2V5a1 1 0 0 1 1-1z" /><path d="M9 12h6M9 16h4" /></>} />,
  messages: <Icon d={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />,
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const isDealer = user?.role === "dealer";

  const links = [
    { href: "/dashboard", label: t("dash.overview"), icon: icons.overview, exact: true },
    { href: "/dashboard/my-ads", label: t("dash.myAds"), icon: icons.ads },
    { href: "/dashboard/messages", label: t("dash.messages"), icon: icons.messages },
    { href: "/dashboard/saved", label: t("dash.savedAds"), icon: icons.saved },
    { href: "/dashboard/profile", label: t("dash.profileSettings"), icon: icons.profile },
    { href: "/dashboard/billing", label: t("dash.billing"), icon: icons.billing },
    { href: "/dashboard/commissions", label: t("dash.commissions"), icon: icons.commissions },
    { href: "/dashboard/purchases", label: t("dash.purchases"), icon: icons.purchases },
    { href: "/dashboard/requests", label: t("dash.requests"), icon: icons.requests },
    {
      // Approved dealers edit their storefront; everyone else sees the
      // application form.
      href: isDealer ? "/dashboard/dealer" : "/dealers/register",
      label: isDealer ? t("dash.dealerProfile") : t("dash.upgradeDealer"),
      icon: icons.dealer,
    },
  ];

  const isActive = (link) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href);

  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      {/* Identity card */}
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3 sm:p-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hw-orange)] text-base font-black text-[var(--hw-text-inverse)] sm:h-12 sm:w-12 sm:text-lg">
            {user?.avatar?.url ? (
              <Image src={user.avatar.url} alt="" width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-black text-[var(--hw-text-primary)] sm:text-base">
              {isAuthenticated ? user?.name : t("dash.loginRequired")}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[var(--hw-soft-panel)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--hw-text-muted)] sm:text-[10px]">
                {user?.role || "user"}
              </span>
              {/* Editing your bio/description lives on a sidebar page people
                  never scrolled to — surface it right under the name. */}
              {isAuthenticated ? (
                <Link href="/dashboard/profile" className="text-[10px] font-bold text-[var(--hw-orange)] hover:underline sm:text-[11px]">
                  {t("dash.editProfile")}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <Link
          href="/post-ad"
          className="mt-3 flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--hw-orange)] text-[13px] font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)] sm:mt-4 sm:h-11 sm:text-sm"
        >
          {icons.post}
          {t("dash.postNewAd")}
        </Link>
      </div>

      {/* Desktop nav */}
      <nav className="mt-4 hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-2 lg:block">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
              isActive(link)
                ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
                : "text-[var(--hw-text-secondary)] hover:bg-[var(--hw-soft-panel)] hover:text-[var(--hw-text-primary)]"
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile nav — horizontal scrollable tabs */}
      <nav className="hw-no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-bold transition ${
              isActive(link)
                ? "border-[var(--hw-orange)] bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
                : "border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-secondary)]"
            }`}
          >
            <span className="[&>svg]:h-4 [&>svg]:w-4">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
