import PlanIcon from "@/components/marketing/PlanIcon";
import { getPlanMeta, isPaidPlan } from "@/lib/plans";

/**
 * PlanAdornments — overlays for a listing card image: a diagonal corner
 * ribbon with the plan name (top-right) and a circular crest badge
 * (bottom-left). Renders nothing for free/unknown plans, so only paid
 * sellers get the premium treatment. The parent image wrapper must be
 * `relative overflow-hidden`.
 */
export default function PlanAdornments({ plan }) {
  if (!isPaidPlan(plan)) return null;
  const meta = getPlanMeta(plan);

  return (
    <>
      {/* Diagonal corner ribbon (top-right) */}
      <div
        className="pointer-events-none absolute right-[-40px] top-[16px] z-10 w-[140px] rotate-45 py-1 text-center text-[10px] font-black uppercase tracking-wider text-white shadow-lg"
        style={{
          background: `linear-gradient(90deg, color-mix(in srgb, ${meta.color} 80%, #000), ${meta.color})`,
          textShadow: "0 1px 2px rgba(0,0,0,0.45)",
        }}
      >
        {meta.name}
      </div>

      {/* Crest badge (bottom-left) */}
      <span
        className="absolute bottom-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-lg ring-1 ring-white/25"
        style={{
          color: "#fff",
          background: `linear-gradient(135deg, color-mix(in srgb, ${meta.color} 70%, #000), ${meta.color})`,
        }}
        title={`${meta.name} seller`}
      >
        <PlanIcon plan={meta.key} size={15} />
      </span>
    </>
  );
}

/**
 * planBorderStyle — inline style that tints a card's border to the plan
 * colour (paid plans only). Spread onto the card element's style prop.
 */
export function planBorderStyle(plan) {
  if (!isPaidPlan(plan)) return undefined;
  const meta = getPlanMeta(plan);
  return { borderColor: `color-mix(in srgb, ${meta.color} 55%, transparent)` };
}
