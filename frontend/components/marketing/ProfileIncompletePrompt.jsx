"use client";

import Link from "next/link";

/**
 * Shown when a seller tries to publish but their profile is missing the
 * details a listing needs — currently a mobile number and a city.
 *
 * Sits alongside UpgradePrompt for the same reason it exists: a bare error
 * tells the seller what they can't do and leaves them to work out the fix.
 * Accounts created through Google or Facebook arrive with no phone number at
 * all, so for those sellers this is the first time they're told, and the link
 * has to take them straight to the field.
 *
 * `fields` comes from the API's `errors` array, so the list reflects what the
 * server actually rejected rather than a guess made here.
 */

const LABELS = {
  phone: "Mobile number",
  city: "City",
  email: "Verified email address",
};

const WHY = {
  phone: "Buyers contact you on this number — it appears on your ad.",
  city: "Buyers filter by location, so ads without a city are rarely found.",
  email: "Confirms the address is yours before your ad goes live.",
};

export default function ProfileIncompletePrompt({ message, fields = [] }) {
  const missing = fields.length ? fields : ["phone"];

  return (
    <div className="rounded-xl border border-[var(--hw-amber)]/50 bg-[var(--hw-amber)]/10 p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--hw-amber)] text-sm font-black text-black"
        >
          !
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-[var(--hw-text-primary)]">
            Finish your profile to post this ad
          </h3>
          <p className="mt-1 text-[13px] leading-6 text-[var(--hw-text-secondary)]">
            {message || "Your ad is ready — we just need a couple of details so buyers can reach you."}
          </p>

          <ul className="mt-3 grid gap-2">
            {missing.map((field) => (
              <li key={field} className="flex items-start gap-2">
                <span aria-hidden className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hw-amber)]" />
                <span className="text-[13px] leading-5">
                  <span className="font-black text-[var(--hw-text-primary)]">
                    {LABELS[field] || field}
                  </span>
                  {WHY[field] ? (
                    <span className="text-[var(--hw-text-secondary)]"> &mdash; {WHY[field]}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          {/* Opens in a new tab deliberately: this form holds unsaved text and
              already-selected photos in component state, and navigating away
              would discard both. */}
          <p className="mt-3 text-[12px] leading-5 text-[var(--hw-text-muted)]">
            Opens in a new tab, so this form and your photos stay exactly as they are.
          </p>

          <div className="mt-3">
            <Link
              href="/dashboard/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)]"
            >
              Complete my profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
