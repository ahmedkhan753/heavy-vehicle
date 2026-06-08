"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/Context/AuthContext";
import { adminApi } from "@/lib/api";
import PlanBadge from "@/components/marketing/PlanBadge";

const PLAN_FILTERS = ["all", "starter", "pro", "elite", "elitePro"];

function daysLeft(date) {
  const ms = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function SubscribersPanel() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const [plan, setPlan] = useState("all");
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    adminApi
      .subscribers({ plan: plan === "all" ? undefined : plan, limit: 100 })
      .then((res) => { setSubs(res?.data || []); setTotal(res?.pagination?.total || 0); })
      .catch(() => { setSubs([]); setTotal(0); });
  }, [isAdmin, plan]);

  if (loading) return <p className="text-[var(--hw-text-secondary)]">Loading…</p>;
  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Not authorized</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {PLAN_FILTERS.map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize transition ${
              plan === p ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)]"
            }`}
          >
            {p === "elitePro" ? "Elite Pro" : p}
          </button>
        ))}
        <span className="ml-auto text-sm text-[var(--hw-text-muted)]">{total} active subscriber{total === 1 ? "" : "s"}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-[var(--hw-border-subtle)] text-left text-[var(--hw-text-muted)]">
              <th className="p-3 font-bold">Seller</th>
              <th className="p-3 font-bold">Plan</th>
              <th className="p-3 font-bold">Cycle</th>
              <th className="p-3 font-bold">Started</th>
              <th className="p-3 font-bold">Expires</th>
              <th className="p-3 font-bold">Ads</th>
            </tr>
          </thead>
          <tbody>
            {subs.length ? subs.map((s) => {
              const left = daysLeft(s.currentPeriodEnd);
              return (
                <tr key={s._id} className="border-b border-[var(--hw-border-subtle)] last:border-b-0">
                  <td className="p-3">
                    <p className="font-bold text-[var(--hw-text-primary)]">{s.userId?.name || "Unknown"}</p>
                    <p className="text-xs text-[var(--hw-text-muted)]">{s.userId?.email}</p>
                  </td>
                  <td className="p-3"><PlanBadge plan={s.planKey} size="sm" /></td>
                  <td className="p-3 capitalize text-[var(--hw-text-secondary)]">{s.billingCycle}</td>
                  <td className="p-3 text-[var(--hw-text-secondary)]">{s.startedAt ? new Date(s.startedAt).toLocaleDateString("en-PK") : "—"}</td>
                  <td className="p-3">
                    <span className="text-[var(--hw-text-primary)]">{new Date(s.currentPeriodEnd).toLocaleDateString("en-PK")}</span>
                    <span className={`ml-2 text-xs font-bold ${left <= 7 ? "text-[var(--hw-amber)]" : "text-[var(--hw-text-muted)]"}`}>({left}d left)</span>
                  </td>
                  <td className="p-3 font-black text-[var(--hw-text-primary)]">{s.userId?.totalAds || 0}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="p-8 text-center text-[var(--hw-text-secondary)]">No active subscribers{plan === "all" ? "" : ` on ${plan}`}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
