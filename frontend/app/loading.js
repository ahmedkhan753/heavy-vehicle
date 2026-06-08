// Root loading UI. Next renders this instantly on navigation to any route that
// doesn't define its own loading.js, while the server component fetches data.
// The layout (Navbar/Footer) stays mounted — only the page body is replaced —
// so clicks feel immediate instead of freezing on the previous page.
export default function Loading() {
  return (
    <main className="hw-container py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {/* Page heading placeholder */}
      <div className="mb-8 space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-[var(--hw-soft-panel-strong)]" />
        <div className="h-9 w-72 max-w-full animate-pulse rounded-lg bg-[var(--hw-soft-panel-strong)]" />
      </div>

      {/* Card grid placeholder — mirrors the marketplace listing layout */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]"
          >
            <div className="aspect-[4/3] w-full animate-pulse bg-[var(--hw-soft-panel-strong)]" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--hw-soft-panel-strong)]" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--hw-soft-panel)]" />
              <div className="h-6 w-1/3 animate-pulse rounded bg-[var(--hw-soft-panel-strong)]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
