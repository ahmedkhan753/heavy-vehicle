"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { adminApi } from "@/lib/api";
import { getPlanMeta } from "@/lib/plans";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const rs = (n) => `Rs ${fmt(n)}`;
const shortDate = (d) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short" });

const Icon = ({ d, className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{d}</svg>
);
const ICONS = {
  cash: <><path d="M3 6h18v12H3z" /><circle cx="12" cy="12" r="2.5" /></>,
  cart: <><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L23 6H6" /></>,
  star: <path d="M12 2l3 7 7 .5-5.5 4.5L18 21l-6-3.8L6 21l1.5-7L2 9.5 9 9z" />,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  users: <><circle cx="9" cy="8" r="4" /><path d="M2 20a7 7 0 0 1 14 0" /><path d="M17 8a4 4 0 0 1 0 8" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};

function Kpi({ icon, label, value, sub, accent, href }) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--hw-text-muted)]">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ color: accent, background: "var(--hw-soft-panel)" }}>
          <Icon d={icon} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-black text-[var(--hw-text-primary)]">{value}</p>
      {sub ? <p className="mt-1 text-xs text-[var(--hw-text-muted)]">{sub}</p> : null}
    </>
  );
  const cls = "rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 transition";
  return href ? <Link href={href} className={`${cls} hover:border-[var(--hw-orange)]`}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

function Stat({ label, value, accent, hint }) {
  return (
    <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
      <p className="text-sm text-[var(--hw-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--hw-text-primary)]" style={accent ? { color: accent } : undefined}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--hw-text-muted)]">{hint}</p> : null}
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-black text-[var(--hw-text-primary)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// Tiny CSS bar chart — no library. `data` is [{ date, count }].
function Sparkbars({ data, color }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-16 items-end gap-1">
      {data.map((d) => (
        <div
          key={d.date}
          title={`${shortDate(d.date)}: ${d.count}`}
          className="flex-1 rounded-t"
          style={{ height: `${Math.max(4, (d.count / max) * 100)}%`, background: color, opacity: d.count ? 0.9 : 0.25 }}
        />
      ))}
    </div>
  );
}

function TrendCard({ title, series, color }) {
  const total = series.reduce((s, d) => s + d.count, 0);
  return (
    <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-[var(--hw-text-muted)]">{title}</p>
        <p className="text-xl font-black text-[var(--hw-text-primary)]">{fmt(total)}</p>
      </div>
      <div className="mt-3"><Sparkbars data={series} color={color} /></div>
      <p className="mt-2 text-xs text-[var(--hw-text-muted)]">last 14 days</p>
    </div>
  );
}

function Feed({ title, items, render, empty }) {
  return (
    <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
      <h3 className="font-black text-[var(--hw-text-primary)]">{title}</h3>
      <div className="mt-3 grid gap-2.5">
        {items.length ? items.map(render) : <p className="py-4 text-center text-sm text-[var(--hw-text-muted)]">{empty}</p>}
      </div>
    </div>
  );
}

function ListingTable({ vehicles, parts }) {
  const rows = [
    ["Total", vehicles.total, parts.total],
    ["Active", vehicles.active, parts.active],
    ["Featured", vehicles.featured, parts.featured],
    ["Premium", vehicles.premium, parts.premium],
    ["Sold", vehicles.sold, parts.sold],
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--hw-border-subtle)] text-left text-[var(--hw-text-muted)]">
            <th className="p-3 font-bold">Listings</th><th className="p-3 font-bold">Vehicles</th><th className="p-3 font-bold">Parts</th><th className="p-3 font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, v, p]) => (
            <tr key={label} className="border-b border-[var(--hw-border-subtle)] last:border-b-0">
              <td className="p-3 font-bold text-[var(--hw-text-secondary)]">{label}</td>
              <td className="p-3 font-black text-[var(--hw-text-primary)]">{fmt(v)}</td>
              <td className="p-3 font-black text-[var(--hw-text-primary)]">{fmt(p)}</td>
              <td className="p-3 font-black text-[var(--hw-orange)]">{fmt(v + p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminOverview() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    adminApi.overview().then((res) => setData(res.data)).catch((e) => setErr(e?.message || "Failed to load"));
  }, [isAdmin]);

  if (loading) return <p className="text-[var(--hw-text-secondary)]">Loading…</p>;
  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Not authorized</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">This area is for administrators only.</p>
      </div>
    );
  }
  if (err) return <p className="text-[var(--hw-red)]">{err}</p>;
  if (!data) return <p className="text-[var(--hw-text-secondary)]">Loading dashboard…</p>;

  const { accounts, vehicles, parts, ads, subscriptions, sales, finance, moderation, recent, trends } = data;
  const planOrder = ["starter", "pro", "elite", "elitePro"];
  const modItems = [
    moderation.pendingPayments > 0 && { label: `${moderation.pendingPayments} payment${moderation.pendingPayments === 1 ? "" : "s"} awaiting verification`, href: "/admin/payments" },
    moderation.disputedSales > 0 && { label: `${moderation.disputedSales} disputed sale${moderation.disputedSales === 1 ? "" : "s"} to review`, href: "/admin/commissions" },
    moderation.pendingListings > 0 && { label: `${moderation.pendingListings} listing${moderation.pendingListings === 1 ? "" : "s"} pending approval`, href: "/vehicles" },
  ].filter(Boolean);

  return (
    <div>
      {/* Hero KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={ICONS.cash} label="Platform earnings" value={rs(finance.platformEarnings)} sub="subs + commissions" accent="var(--hw-green)" />
        <Kpi icon={ICONS.cart} label="Marketplace GMV" value={rs(sales.grossValue)} sub={`${fmt(sales.totalSales)} sales`} accent="var(--hw-cyan)" />
        <Kpi icon={ICONS.star} label="Active subscriptions" value={fmt(subscriptions.activeTotal)} sub={`${rs(subscriptions.mrr)} MRR`} accent="var(--hw-orange)" />
        <Kpi icon={ICONS.clock} label="Pending payments" value={fmt(subscriptions.pendingPayments)} sub="tap to verify" accent="var(--hw-amber)" href="/admin/payments" />
        <Kpi icon={ICONS.users} label="Total accounts" value={fmt(accounts.total)} sub={`+${fmt(accounts.newSignups.last7)} this week`} accent="var(--hw-blue)" />
        <Kpi icon={ICONS.list} label="Total ads" value={fmt(ads.total)} sub={`${fmt(ads.active)} active`} accent="var(--hw-text-primary)" />
      </div>

      {/* Moderation queue */}
      {modItems.length ? (
        <Section title="Needs attention">
          <div className="grid gap-3">
            {modItems.map((m) => (
              <Link key={m.href + m.label} href={m.href} className="flex items-center justify-between rounded-xl border border-[var(--hw-amber)] bg-[var(--hw-soft-panel)] p-4 transition hover:border-[var(--hw-orange)]">
                <span className="font-bold text-[var(--hw-text-primary)]">⚠ {m.label}</span>
                <span className="text-sm font-black text-[var(--hw-orange)]">Review →</span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Trends */}
      <Section title="Trends">
        <div className="grid gap-4 sm:grid-cols-3">
          <TrendCard title="New signups" series={trends.signups} color="var(--hw-blue)" />
          <TrendCard title="New listings" series={trends.listings} color="var(--hw-orange)" />
          <TrendCard title="Sales" series={trends.sales} color="var(--hw-green)" />
        </div>
      </Section>

      {/* Accounts */}
      <Section title="Accounts">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active sellers" value={fmt(accounts.activeSellers)} accent="var(--hw-orange)" hint="posted ≥1 ad" />
          <Stat label="Buyers" value={fmt(accounts.buyers)} accent="var(--hw-green)" hint="have purchased" />
          <Stat label="Dealers" value={fmt(accounts.dealers)} accent="var(--hw-blue)" hint={`${fmt(accounts.regularUsers)} regular · ${fmt(accounts.admins)} admin`} />
          <Stat label="New signups" value={fmt(accounts.newSignups.today)} accent="var(--hw-cyan)" hint={`today · ${fmt(accounts.newSignups.last30)} in 30d`} />
        </div>
      </Section>

      {/* Listings */}
      <Section title="Listings" action={<Link href="/vehicles" className="text-sm font-bold text-[var(--hw-orange)] hover:underline">Browse all →</Link>}>
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Total ads" value={fmt(ads.total)} />
          <Stat label="Active" value={fmt(ads.active)} accent="var(--hw-green)" />
          <Stat label="Featured" value={fmt(ads.featured)} accent="var(--hw-orange)" />
          <Stat label="Premium" value={fmt(ads.premium)} accent="var(--hw-cyan)" />
          <Stat label="Sold" value={fmt(ads.sold)} accent="var(--hw-blue)" />
        </div>
        <ListingTable vehicles={vehicles} parts={parts} />
      </Section>

      {/* Subscriptions */}
      <Section title="Subscriptions" action={<Link href="/admin/subscribers" className="text-sm font-bold text-[var(--hw-orange)] hover:underline">View subscribers →</Link>}>
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Active subscriptions" value={fmt(subscriptions.activeTotal)} accent="var(--hw-green)" />
          <Stat label="Monthly recurring revenue" value={rs(subscriptions.mrr)} accent="var(--hw-orange)" />
          <Stat label="Expiring within 7 days" value={fmt(subscriptions.expiringSoon)} accent="var(--hw-amber)" />
        </div>
        <div className="flex flex-wrap gap-3">
          {planOrder.map((key) => {
            const meta = getPlanMeta(key);
            return (
              <span key={key} className="inline-flex items-center gap-2 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
                <span className="text-sm font-bold text-[var(--hw-text-secondary)]">{meta.name}</span>
                <span className="text-sm font-black text-[var(--hw-text-primary)]">{fmt(subscriptions.activeByPlan[key] || 0)}</span>
              </span>
            );
          })}
        </div>
      </Section>

      {/* Sales + Finance */}
      <Section title="Sales & finance" action={<Link href="/admin/commissions" className="text-sm font-bold text-[var(--hw-orange)] hover:underline">Commissions →</Link>}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Platform earnings" value={rs(finance.platformEarnings)} accent="var(--hw-green)" hint="subscriptions + commissions" />
          <Stat label="Subscription revenue" value={rs(finance.subscriptionRevenue)} accent="var(--hw-cyan)" hint="verified payments" />
          <Stat label="Commission due" value={rs(finance.commissions.due?.amount || 0)} accent="var(--hw-amber)" hint={`${fmt(finance.commissions.due?.count || 0)} owed`} />
          <Stat label="Commission overdue" value={rs(finance.commissions.overdue?.amount || 0)} accent="var(--hw-red)" hint={`${fmt(finance.commissions.overdue?.count || 0)} late`} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Vehicles sold" value={fmt(sales.vehiclesSold)} accent="var(--hw-orange)" />
          <Stat label="Parts sold" value={fmt(sales.partsSold)} accent="var(--hw-cyan)" />
          <Stat label="Total sales" value={fmt(sales.totalSales)} accent="var(--hw-green)" />
          <Stat label="Gross sale value (GMV)" value={rs(sales.grossValue)} hint="reported" />
        </div>
      </Section>

      {/* Recent activity feeds */}
      <Section title="Recent activity">
        <div className="grid gap-4 lg:grid-cols-3">
          <Feed
            title="New signups"
            items={recent.signups}
            empty="No signups yet"
            render={(u) => (
              <div key={u._id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--hw-text-primary)]">{u.name}</p>
                  <p className="truncate text-xs text-[var(--hw-text-muted)]">{u.email}</p>
                </div>
                <span className="shrink-0 rounded bg-[var(--hw-soft-panel)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--hw-text-secondary)]">{u.role}</span>
              </div>
            )}
          />
          <Feed
            title="New listings"
            items={recent.listings}
            empty="No listings yet"
            render={(l) => (
              <div key={l._id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--hw-text-primary)]">{l.title}</p>
                  <p className="text-xs text-[var(--hw-text-muted)]">{l.kind} · {l.priceDisplay ? `Rs ${l.priceDisplay}` : rs(l.price)}</p>
                </div>
                {l.featured ? <span className="shrink-0 rounded bg-[var(--hw-orange)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--hw-text-inverse)]">Feat</span> : null}
              </div>
            )}
          />
          <Feed
            title="Recent sales"
            items={recent.sales}
            empty="No sales yet"
            render={(s) => (
              <div key={s._id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--hw-text-primary)]">{s.listingTitle || s.listingType}</p>
                  <p className="text-xs text-[var(--hw-text-muted)]">{s.listingType} · {shortDate(s.createdAt)}</p>
                </div>
                <span className="shrink-0 text-sm font-black text-[var(--hw-green)]">{rs(s.salePrice)}</span>
              </div>
            )}
          />
        </div>
      </Section>
    </div>
  );
}
