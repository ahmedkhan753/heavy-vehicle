"use client";

import { useTheme } from "@/Context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-soft-panel)] px-3 text-xs font-black text-[var(--hw-text-secondary)] hover:border-[var(--hw-orange)] hover:text-[var(--hw-text-primary)]"
      aria-label="Toggle theme"
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--hw-bg-elevated)] text-[var(--hw-orange)]">
        {isLight ? (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3a6 6 0 0 0 9 7.5A9 9 0 1 1 12 3Z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        )}
      </span>
      {isLight ? "Dark" : "Light"}
    </button>
  );
}
