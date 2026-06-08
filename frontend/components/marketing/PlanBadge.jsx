import PlanIcon from "@/components/marketing/PlanIcon";
import { getPlanMeta } from "@/lib/plans";

/**
 * PlanBadge — inline pill showing a plan's crest + name, themed to the plan
 * colour. Used on account surfaces (dashboard, dealer profile, seller box).
 * Pass hideFree to render nothing for the free tier.
 */
export default function PlanBadge({ plan, size = "md", hideFree = false, className = "" }) {
  const meta = getPlanMeta(plan);
  if (hideFree && !meta.paid) return null;

  const dims = size === "sm"
    ? { pad: "px-2 py-0.5 text-[10px]", icon: 12, gap: "gap-1" }
    : size === "lg"
      ? { pad: "px-3.5 py-1.5 text-sm", icon: 18, gap: "gap-1.5" }
      : { pad: "px-3 py-1 text-xs", icon: 14, gap: "gap-1.5" };

  return (
    <span
      className={`inline-flex items-center ${dims.gap} rounded-full font-black uppercase tracking-wide ${dims.pad} ${className}`}
      style={{
        color: meta.color,
        background: `color-mix(in srgb, ${meta.color} 16%, transparent)`,
        border: `1px solid color-mix(in srgb, ${meta.color} 45%, transparent)`,
      }}
    >
      <PlanIcon plan={meta.key} size={dims.icon} />
      {meta.name}
    </span>
  );
}
