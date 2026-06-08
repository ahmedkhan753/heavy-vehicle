"use client";

/**
 * Live password-requirements indicator. Mirrors the backend rule:
 * 8+ chars and at least one uppercase, one lowercase, and one number.
 */

export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter (a–z)", test: (v) => /[a-z]/.test(v) },
  { label: "One number (0–9)", test: (v) => /\d/.test(v) },
];

export function isStrongPassword(value = "") {
  return PASSWORD_RULES.every((r) => r.test(value));
}

export default function PasswordHints({ value = "" }) {
  return (
    <ul className="mt-2 grid gap-1 text-xs font-bold">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.label}
            className={met ? "text-[var(--hw-green)]" : "text-[var(--hw-text-muted)]"}
          >
            <span aria-hidden="true">{met ? "✓" : "○"}</span> {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
