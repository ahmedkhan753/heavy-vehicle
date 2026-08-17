"use client";

export default function AssistantInput({
  value,
  loading,
  placeholder,
  sendLabel,
  onChange,
  onSend,
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) onSend();
        }}
        placeholder={placeholder}
        maxLength={2000}
        className="w-full rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-base)] px-3 py-2 text-sm text-[var(--hw-text-primary)] outline-none ring-0 placeholder:text-[var(--hw-text-muted)] focus:border-[var(--hw-orange)]"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={loading || !value.trim()}
        className="rounded-xl bg-[var(--hw-orange)] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sendLabel}
      </button>
    </div>
  );
}
