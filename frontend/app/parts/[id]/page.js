import Link from "next/link";
import Image from "next/image";
import PartCard from "@/components/parts/PartCard";
import PlanBadge from "@/components/marketing/PlanBadge";
import { planBorderStyle } from "@/components/marketing/PlanAdornments";
import { API_BASE_URL } from "@/lib/api";
import { fallbackImage } from "@/lib/constants";
import { partCategoryLabel, partSubcategoryLabel, partTypeLabel, warrantyLabel } from "@/lib/parts";
import { formatPrice, titleCase } from "@/lib/format";
import { getT, getLang } from "@/lib/i18n-server";
import TranslatedText from "@/components/ui/TranslatedText";

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
    ["Category", partCategoryLabel(part.category, lang)],
    ...(part.subcategory ? [["Part", partSubcategoryLabel(part.subcategory)]] : []),
    ["Condition", titleCase(part.condition)],
    ...(part.partType ? [["Type", partTypeLabel(part.partType)]] : []),
    ...(part.warranty && part.warranty !== "none" ? [["Warranty", warrantyLabel(part.warranty)]] : []),
    ["Make", titleCase(part.make || "not listed")],
    ["Model", part.model || "Not listed"],
    ["Quantity", part.quantity || 1],
    ["City", titleCase(part.city)],
    ["Area", part.area || "Not listed"],
    ["Province", titleCase(part.province || "not listed")],
  ];

  return (
    <main className="hw-container py-10">
      <div className="mb-6 text-sm text-[var(--hw-text-muted)]">
        <Link href="/parts" className="hover:text-[var(--hw-orange)]">
          Parts
        </Link>
        <span> / {title}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="overflow-hidden rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
            <div className="relative aspect-[16/9] w-full">
              <Image src={partImage(part)} alt={part.title} fill priority sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-2 border-t border-[var(--hw-border-subtle)] p-3">
              {(part.images || []).slice(0, 4).map((item) => (
                <div key={item.publicId || item.url} className="relative aspect-[16/10] overflow-hidden rounded-md">
                  <Image src={item.url} alt="" fill sizes="(max-width: 1024px) 25vw, 180px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-black text-[var(--hw-text-primary)]">{title}</h1>
                <p className="mt-2 text-sm text-[var(--hw-text-muted)]">
                  {partCategoryLabel(part.category, lang)} | {titleCase(part.city)}
                </p>
              </div>
              <span className="w-fit rounded-md bg-[var(--hw-bg-elevated)] px-3 py-2 text-xs font-black text-[var(--hw-green)]">
                {titleCase(part.status || "active")}
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-[var(--hw-orange)]">
              {formatPrice(part.price, part.priceDisplay)}
            </p>
            {part.negotiable ? (
              <p className="mt-1 text-sm font-bold text-[var(--hw-text-secondary)]">Negotiable</p>
            ) : null}
          </div>

          <div className="mt-6 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Part details</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {specs.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] px-4 py-3">
                  <span className="text-sm text-[var(--hw-text-muted)]">{label}</span>
                  <span className="text-right text-sm font-bold text-[var(--hw-text-primary)]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Description</h2>
            <TranslatedText
              primary={descPrimary}
              secondary={descSecondary}
              showLabel={showLabel}
              hideLabel={hideLabel}
              className="mt-3 leading-7 text-[var(--hw-text-secondary)]"
            />
          </div>
        </section>

        <aside style={planBorderStyle(part.seller?.plan)} className="h-fit rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Seller</p>
            <PlanBadge plan={part.seller?.plan} size="sm" hideFree />
          </div>
          <h2 className="mt-2 text-xl font-black text-[var(--hw-text-primary)]">{seller.name || "Seller"}</h2>
          <p className="mt-1 text-sm text-[var(--hw-text-muted)]">
            {titleCase(seller.city || part.city)} | {seller.role ? titleCase(seller.role) : "Parts seller"}
          </p>
          <div className="mt-5 grid gap-3">
            {(seller.phone || part.seller?.phone) ? (
              <a
                href={`tel:${seller.phone || part.seller.phone}`}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--hw-green)] text-sm font-black text-[var(--hw-text-inverse)]"
              >
                Call Seller
              </a>
            ) : null}
            {(part.seller?.whatsapp || seller.phone) ? (
              <a
                href={`https://wa.me/${part.seller?.whatsapp || seller.phone}`}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
          <div className="mt-5 rounded-lg bg-[var(--hw-bg-deep)] p-4 text-sm leading-6 text-[var(--hw-text-secondary)]">
            Inspect used parts carefully, verify fitment before payment, and keep proof of purchase.
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-10">
          <h2 className="mb-5 text-2xl font-black text-[var(--hw-text-primary)]">Featured parts</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <PartCard key={item._id} part={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
