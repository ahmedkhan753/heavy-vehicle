"use client";

/**
 * Two shapes of "needs your attention" marker, kept in one file so the red
 * stays identical everywhere it appears:
 *
 *   <NotificationBadge count={3} />  → numeric, for countable queues
 *                                      (unread messages, pending approvals)
 *   <AlertBadge />                   → a bare "!", for a dated warning that
 *                                      has no meaningful count (plan about
 *                                      to expire, commission coming due)
 *
 * Counts above 99 render as "99+" so a long-ignored queue can't stretch the
 * tab it sits on.
 */

export function NotificationBadge({ count, className = "" }) {
  if (!count || count < 1) return null;
  return (
    <span
      aria-label={`${count} unread`}
      className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white ring-2 ring-[var(--hw-bg-card)] ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AlertBadge({ className = "", title }) {
  return (
    <span
      title={title}
      aria-label={title || "Needs attention"}
      className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-600 text-[11px] font-black leading-none text-white ring-2 ring-[var(--hw-bg-card)] ${className}`}
    >
      !
    </span>
  );
}

export default NotificationBadge;
