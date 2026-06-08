"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { adminApi } from "@/lib/api";
import PlanBadge from "@/components/marketing/PlanBadge";

const ROLES = ["all", "user", "dealer", "admin"];
const SETTABLE_ROLES = ["user", "dealer", "admin"];

export default function UsersPanel() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === "admin";
  const [role, setRole] = useState("all");
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(() => {
    if (!isAdmin) return;
    adminApi
      .users({ role: role === "all" ? undefined : role, q: q.trim() || undefined, limit: 100 })
      .then((res) => { setUsers(res?.data || []); setTotal(res?.pagination?.total || 0); })
      .catch(() => { setUsers([]); setTotal(0); });
  }, [isAdmin, role, q]);

  // Debounce the search so we don't fire on every keystroke.
  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  async function changeRole(id, newRole) {
    setBusyId(id);
    try {
      await adminApi.setRole(id, newRole);
      toast.success(`Role set to ${newRole}`);
      load();
    } catch (e) {
      toast.error(e?.message || "Failed to update role");
    } finally {
      setBusyId("");
    }
  }

  async function toggleBan(u) {
    const banning = !u.isBanned;
    if (banning && !window.confirm(`Ban ${u.name}? They won't be able to log in.`)) return;
    setBusyId(u._id);
    try {
      await adminApi.setBan(u._id, banning);
      toast.success(banning ? "User banned" : "User unbanned");
      load();
    } catch (e) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusyId("");
    }
  }

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
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or phone…"
          className="h-10 w-full max-w-xs rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
        />
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize transition ${role === r ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)]"}`}
          >
            {r}
          </button>
        ))}
        <span className="ml-auto text-sm text-[var(--hw-text-muted)]">{total} account{total === 1 ? "" : "s"}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[var(--hw-border-subtle)] text-left text-[var(--hw-text-muted)]">
              <th className="p-3 font-bold">Account</th>
              <th className="p-3 font-bold">Plan</th>
              <th className="p-3 font-bold">Joined</th>
              <th className="p-3 font-bold">Ads</th>
              <th className="p-3 font-bold">Role</th>
              <th className="p-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length ? users.map((u) => {
              const self = u._id === user?._id;
              const busy = busyId === u._id;
              return (
                <tr key={u._id} className={`border-b border-[var(--hw-border-subtle)] last:border-b-0 ${u.isBanned ? "opacity-60" : ""}`}>
                  <td className="p-3">
                    <p className="font-bold text-[var(--hw-text-primary)]">
                      {u.name} {self ? <span className="text-xs font-normal text-[var(--hw-text-muted)]">(you)</span> : null}
                      {u.isBanned ? <span className="ml-2 rounded bg-[var(--hw-red)] px-1.5 py-0.5 text-[10px] font-black uppercase text-white">Banned</span> : null}
                    </p>
                    <p className="text-xs text-[var(--hw-text-muted)]">{u.email}</p>
                  </td>
                  <td className="p-3"><PlanBadge plan={u.plan} size="sm" hideFree /></td>
                  <td className="p-3 text-[var(--hw-text-secondary)]">{new Date(u.createdAt).toLocaleDateString("en-PK")}</td>
                  <td className="p-3 font-black text-[var(--hw-text-primary)]">{u.totalAds || 0}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      disabled={self || busy}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                      className="h-9 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-2 text-sm font-bold capitalize text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] disabled:opacity-50"
                    >
                      {SETTABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleBan(u)}
                      disabled={self || busy || (u.role === "admin" && !u.isBanned)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-bold transition disabled:opacity-40 ${u.isBanned ? "border border-[var(--hw-green)] text-[var(--hw-green)]" : "border border-[var(--hw-red)] text-[var(--hw-red)]"}`}
                      title={u.role === "admin" && !u.isBanned ? "Can't ban an admin" : ""}
                    >
                      {u.isBanned ? "Unban" : "Ban"}
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="p-8 text-center text-[var(--hw-text-secondary)]">No accounts match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
