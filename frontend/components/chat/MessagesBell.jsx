"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { chatApi } from "@/lib/api";

/**
 * Navbar messages bell — polls unread count while signed in.
 */
export default function MessagesBell() {
  const { isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { setUnread(0); return; }
    let active = true;
    const poll = () => chatApi.unread().then((r) => { if (active) setUnread(r?.data?.unread || 0); }).catch(() => {});
    poll();
    const t = setInterval(poll, 20000);
    return () => { active = false; clearInterval(t); };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <Link
      href="/dashboard/messages"
      aria-label="Messages"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)] hover:border-[var(--hw-orange)] hover:text-[var(--hw-text-primary)]"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {unread > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--hw-orange)] px-1.5 text-[10px] font-black text-[var(--hw-text-inverse)]">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
