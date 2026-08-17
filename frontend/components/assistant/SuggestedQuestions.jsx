"use client";

export default function SuggestedQuestions({ items, disabled, onSelect }) {
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onSelect(item.prompt)}
          disabled={disabled}
          className="rounded-full border border-[var(--hw-border-default)] bg-[var(--hw-bg-base)] px-2.5 py-1 text-[11px] font-semibold text-[var(--hw-text-secondary)] transition hover:border-[var(--hw-orange)] hover:text-[var(--hw-orange)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
