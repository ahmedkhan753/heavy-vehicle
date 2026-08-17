"use client";

export default function TypingIndicator({ label }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] px-3 py-2 text-sm text-[var(--hw-text-secondary)]">
        <span>{label}</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--hw-orange)]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--hw-orange)] [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--hw-orange)] [animation-delay:240ms]" />
        </span>
      </div>
    </div>
  );
}
