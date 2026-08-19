import Link from "next/link";
import PartCard from "@/components/parts/PartCard";
import VehicleGallery from "@/components/vehicles/VehicleGallery";
import PlanBadge from "@/components/marketing/PlanBadge";
import { planBorderStyle } from "@/components/marketing/PlanAdornments";
import { API_BASE_URL } from "@/lib/api";
import { fallbackImage } from "@/lib/constants";
import { partCategoryLabel, partSubcategoryLabel, partTypeLabel, warrantyLabel } from "@/lib/parts";
import { formatPrice, titleCase } from "@/lib/format";
import { getT, getLang } from "@/lib/i18n-server";
import TranslatedText from "@/components/ui/TranslatedText";
import ListingTopBar from "@/components/listing/ListingTopBar";
import { Chip, QuickSpecs, SpecGrid, Panel } from "@/components/listing/ListingBits";

export const revalidate = 60;

function partImage(part) {
  return part?.coverImage || part?.images?.[0]?.url || fallbackImage;
}

async function getPartDetail(id) {
  try {
    const [partRes, featuredRes] = await Promise.all([
      fetch(`${API_BASE_URL}/parts/${id}`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE_URL}/parts/featured?limit=3`, { next: { revalidate: 60 } }),
      // View count is a mutation — never cache it, so every visit still counts.
      fetch(`${API_BASE_URL}/parts/${id}/view`, { method: "POST", cache: "no-store" }).catch(() => null),
    ]);

    if (!partRes.ok) throw new Error("Part not found");
    const part = await partRes.json();
    const featured = featuredRes.ok ? await featuredRes.json() : { data: [] };

    return {
      part: part.data,
      related: (featured.data || []).filter((item) => item._id !== id),
    };
  } catch {
    return { part: null, related: [] };
  }
}

export default async function PartDetailPage({ params }) {
  const { id } = await params;
  const { part, related } = await getPartDetail(id);
  const t = await getT();
  const lang = await getLang();

  if (!part) {
    return (
      <main className="hw-container py-16">
        <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
          <h1 className="text-2xl font-black text-[var(--hw-text-primary)]">Part ad not found</h1>
          <p className="mt-2 text-[var(--hw-text-secondary)]">
            This spare part may not exist yet, or the backend is not running.
          </p>
          <Link
            href="/parts"
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]"
          >
            Back to Parts
          </Link>
        </div>
      </main>
    );
  }

  const seller = part.sellerId || part.seller || {};

  // Bilingual content: show the cookie-language version, other version via toggle.
  const title = lang === "ur" ? (part.titleUr || part.title) : part.title;
  const descEn = part.description || "";
  const descUr = part.descriptionUr || "";
  const descPrimary = (lang === "ur" ? (descUr || descEn) : descEn) || "Seller has not added a detailed description yet.";
  const descSecondary = lang === "ur" ? descEn : descUr;
  const showLabel = lang === "ur" ? t("listing.showEnglish") : t("listing.showUrdu");
  const hideLabel = lang === "ur" ? t("listing.showUrdu") : t("listing.showEnglish");

  const specs = [
    ["Category", partCategoryLabel(part.category, lang), "layers"],
    ...(part.subcategory ? [["Part", partSubcategoryLabel(part.subcategory), "wrench"]] : []),
    ["Condition", titleCase(part.condition), "tag"],
    ...(part.partType ? [["Type", partTypeLabel(part.partType), "box"]] : []),
    ...(part.warranty && part.warranty !== "none" ? [["Warranty", warrantyLabel(part.warranty), "shield"]] : []),
    ["Make", titleCase(part.make || "not listed"), "badge"],
    ["Model", part.model || "Not listed", "hash"],
    ["Quantity", part.quantity || 1, "box"],
    ["City", titleCase(part.city), "pin"],
    ["Area", part.area || "Not listed", "pin"],
    ["Province", titleCase(part.province || "not listed"), "pin"],
  ];

  const quickSpecs = [
    ["Condition", titleCase(part.condition)],
    ["Make", titleCase(part.make || "—")],
    ["Model", part.model || "—"],
    ["Quantity", part.quantity || 1],
  ];

  return (
    <main className="hw-container py-3 sm:py-6 lg:py-10">
      <ListingTopBar title={title} />

      <div className="mb-6 hidden text-sm text-[var(--hw-text-muted)] lg:block">
        <Link href="/parts" className="hover:text-[var(--hw-orange)]">
          Parts
        </Link>
        <span> / {title}</span>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <section className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
          <VehicleGallery
            images={part.images}
            title={title}
            fallbackImage={partImage(part)}
          />

          <div className="mt-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:mt-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg font-black leading-tight text-[var(--hw-text-primary)] sm:text-2xl lg:text-3xl">{title}</h1>
                <p className="mt-1 truncate text-[11px] text-[var(--hw-text-muted)] sm:mt-2 sm:text-sm">
                  {partCategoryLabel(part.category, lang)} · {titleCase(part.city)}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-base font-black leading-tight text-[var(--hw-orange)] sm:text-2xl lg:text-3xl">
                  {formatPrice(part.price, part.priceDisplay)}
                </p>
                {part.negotiable ? (
                  <p className="mt-0.5 text-[10px] font-bold uppercase text-[var(--hw-text-secondary)] sm:text-xs">Negotiable</p>
                ) : null}
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
              <Chip icon="layers">{partCategoryLabel(part.category, lang)}</Chip>
              <Chip icon="tag">{titleCase(part.condition)}</Chip>
              {part.warranty && part.warranty !== "none" ? (
                <Chip icon="shield">{warrantyLabel(part.warranty)}</Chip>
              ) : null}
              <Chip icon="pin">{titleCase(part.city)}</Chip>
            </div>
          </div>
        </section>

        <aside
          style={planBorderStyle(part.seller?.plan)}
          className="order-2 h-fit min-w-0 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:row-span-2"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase text-[var(--hw-orange)] sm:text-xs">Seller</p>
            <PlanBadge plan={part.seller?.plan} size="sm" hideFree />
          </div>
          <h2 className="mt-1.5 text-base font-black text-[var(--hw-text-primary)] sm:mt-2 sm:text-xl">{seller.name || "Seller"}</h2>
          <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:mt-1 sm:text-sm">
            {titleCase(seller.city || part.city)} · {seller.role ? titleCase(seller.role) : "Parts seller"}
          </p>
          <div className="mt-3.5 grid gap-2 sm:mt-5 sm:gap-3">
            {(seller.phone || part.seller?.phone) ? (
              <a
                href={`tel:${seller.phone || part.seller.phone}`}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--hw-green)] text-[13px] font-black text-[var(--hw-text-inverse)] sm:h-12 sm:text-sm"
              >
                Call Seller
              </a>
            ) : null}
            {(part.seller?.whatsapp || seller.phone) ? (
              <a
                href={`https://wa.me/${part.seller?.whatsapp || seller.phone}`}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] text-[13px] font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)] sm:h-12 sm:text-sm"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
          <div className="mt-3.5 rounded-lg bg-[var(--hw-bg-deep)] p-3 text-[11px] leading-5 text-[var(--hw-text-secondary)] sm:mt-5 sm:p-4 sm:text-sm sm:leading-6">
            Inspect used parts carefully, verify fitment before payment, and keep proof of purchase.
          </div>
        </aside>

        <div className="order-3 grid min-w-0 gap-3 sm:gap-4 lg:col-start-1 lg:row-start-2">
          <QuickSpecs items={quickSpecs} />

          <Panel title={t("listing.overview")}>
            <TranslatedText
              primary={descPrimary}
              secondary={descSecondary}
              showLabel={showLabel}
              hideLabel={hideLabel}
              className="text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-base sm:leading-7"
            />
          </Panel>

          <Panel title="Part details">
            <SpecGrid specs={specs} />
          </Panel>
        </div>
      </div>

      {related.length ? (
        <section className="mt-6 sm:mt-10">
          <h2 className="mb-3 text-[17px] font-black text-[var(--hw-text-primary)] sm:mb-5 sm:text-2xl">Featured parts</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-3">
            {related.map((item) => (
              <PartCard key={item._id} part={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
