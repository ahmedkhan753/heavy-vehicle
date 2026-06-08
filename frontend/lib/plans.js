/**
 * Plan visual metadata — single source of truth for the frontend's
 * per-subscription theming (badge colour, label, tier crest icon).
 * Colours mirror the neon accents used on the pricing banners.
 */

export const PLAN_META = {
  free: { key: "free", name: "Free", short: "Free", color: "#94a3b8", crest: "spark", paid: false },
  starter: { key: "starter", name: "Starter", short: "Starter", color: "#22d3ee", crest: "shield", paid: true },
  pro: { key: "pro", name: "Pro", short: "Pro", color: "#f97316", crest: "star", paid: true },
  elite: { key: "elite", name: "Elite", short: "Elite", color: "#3b82f6", crest: "crown", paid: true },
  elitePro: { key: "elitePro", name: "Elite Pro", short: "Elite+", color: "#10b981", crest: "diamond", paid: true },
};

/** Resolve a plan key (or undefined) to its metadata, defaulting to Free. */
export function getPlanMeta(plan) {
  return PLAN_META[plan] || PLAN_META.free;
}

/** True when the plan should show the premium ribbon/icon treatment. */
export function isPaidPlan(plan) {
  return Boolean(PLAN_META[plan]?.paid);
}
