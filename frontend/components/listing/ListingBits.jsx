/**
 * Presentational building blocks shared by the vehicle and part detail pages.
 *
 * These are deliberately server-safe (no hooks, no "use client") so the detail
 * pages can stay server components. Every piece is sized mobile-first: compact
 * by default, roomier from `sm` up, so a phone shows the whole listing without
 * the oversized desktop type/padding it used to inherit.
 */

const ICON_PATHS = {
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 11h18" /></>,
  gauge: <><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /><path d="M13.4 10.6 19 5" /><path d="M20.5 16a9 9 0 1 0-17 0" /></>,
  fuel: <><path d="M3 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" /><path d="M2 21h13" /><path d="M13 10h3a2 2 0 0 1 2 2v5a2 2 0 0 0 4 0V9l-3-3" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H7a1.7 1.7 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V7a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  truck: <><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-4l-3-4h-5v8h2" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  engine: <><path d="M6 10V7h5V5h4v2h2l3 3h2v6h-2v3H9v-3H6l-3-3v-3z" /></>,
  axle: <><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M9 17h6M6 14V7h12v7" /></>,
  tag: <><path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h9z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  badge: <><circle cx="12" cy="8" r="5" /><path d="M8.2 12.5 7 22l5-3 5 3-1.2-9.5" /></>,
  hash: <><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></>,
  box: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  wrench: <><path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3z" /></>,
  layers: <><path d="m12 2 9 5-9 5-9-5z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>,
};

export function Icon({ name, className = "h-3.5 w-3.5" }) {
  const path = ICON_PATHS[name] || ICON_PATHS.tag;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {path}
    </svg>
  );
}

/** Small pill used for the at-a-glance row under the listing title. */
export function Chip({ icon, children }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] px-2 py-1 text-[11px] font-bold text-[var(--hw-text-secondary)] sm:px-2.5 sm:text-xs">
      {icon ? <Icon name={icon} className="h-3.5 w-3.5 shrink-0 text-[var(--hw-orange)]" /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * The 4-up "headline numbers" strip (condition / make / model / km). Splits
 * 2x2 on the narrowest phones so the values never get squeezed to one char.
 */
export function QuickSpecs({ items }) {
  const shown = items.filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!shown.length) return null;
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-border-subtle)] sm:grid-cols-4">
      {shown.map(([label, value]) => (
        <div key={label} className="min-w-0 bg-[var(--hw-bg-card)] px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-[var(--hw-text-muted)] sm:text-[11px]">{label}</p>
          <p className="mt-0.5 truncate text-sm font-black text-[var(--hw-text-primary)] sm:text-base">{value}</p>
        </div>
      ))}
    </div>
  );
}

/** Icon + label + value rows, two per line — the main specification table. */
export function SpecGrid({ specs }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {specs.map(([label, value, icon]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-3 border-b border-[var(--hw-border-subtle)] py-2.5 last:border-b-0 sm:py-3"
        >
          <span className="flex min-w-0 items-center gap-2 text-xs text-[var(--hw-text-muted)] sm:text-sm">
            <Icon name={icon} className="h-4 w-4 shrink-0 text-[var(--hw-text-muted)]" />
            <span className="truncate">{label}</span>
          </span>
          <span className="shrink-0 text-right text-xs font-bold text-[var(--hw-text-primary)] sm:text-sm">{value}</span>
        </div>
      ))}
    </div>
  );
}

/** Consistent card shell for the stacked blocks on a detail page. */
export function Panel({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5 ${className}`}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}
