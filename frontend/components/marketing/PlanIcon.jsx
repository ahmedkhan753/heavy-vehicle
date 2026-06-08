import { getPlanMeta } from "@/lib/plans";

/**
 * PlanIcon — the tier crest for a subscription plan.
 * Escalates by tier: spark → shield → star → crown → diamond.
 * Uses currentColor, so set the colour on the element (or a wrapping span).
 */

const CRESTS = {
  // 4-point sparkle
  spark: <path d="M12 2l2.2 6.1L20 10.3l-5.8 2.2L12 18l-2.2-5.5L4 10.3l5.8-2.2L12 2z" />,
  // shield
  shield: <path d="M12 2l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V5l7-3z" />,
  // 5-point star
  star: <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5z" />,
  // crown
  crown: <path d="M3 7l4 4 5-7 5 7 4-4-1.5 12h-15L3 7zm2.5 14h13v2h-13v-2z" />,
  // diamond / gem
  diamond: <path d="M6 2h12l4 6-10 14L2 8l4-6zm.7 2L4.3 7.6h4.2L9.8 4H6.7zm7.5 0l1.3 3.6h4.2L17.3 4h-3.1zM8.4 8L12 18.6 15.6 8H8.4z" />,
};

export default function PlanIcon({ plan, size = 16, className = "" }) {
  const meta = getPlanMeta(plan);
  const crest = CRESTS[meta.crest] || CRESTS.spark;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {crest}
    </svg>
  );
}
