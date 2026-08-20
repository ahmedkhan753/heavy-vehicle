import Link from "next/link";
import PartCard from "@/components/parts/PartCard";
import VehicleGallery from "@/components/vehicles/VehicleGallery";
import PlanBadge from "@/components/marketing/PlanBadge";
import { planBorderStyle } from "@/components/marketing/PlanAdornments";
import { SERVER_API_BASE_URL } from "@/lib/api";
import { fallbackImage } from "@/lib/constants";
import { partCategoryLabel, partSubcategoryLabel, partTypeLabel, warrantyLabel } from "@/lib/parts";
import { formatPrice, titleCase } from "@/lib/format";
import { getT, getLang } from "@/lib/i18n-server";
import TranslatedText from "@/components/ui/TranslatedText";
import ListingTopBar from "@/components/listing/ListingTopBar";
import SellerContact from "@/components/listing/SellerContact";
import Comments from "@/components/listing/Comments";
import ShareMenu from "@/components/listing/ShareMenu";
import { Chip, QuickSpecs, SpecGrid, Panel } from "@/components/listing/ListingBits";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 60;

function partImage(part) {
  return part?.coverImage || part?.images?.[0]?.url || fallbackImage;
}

// Same fetch signature as the part fetch inside getPartDetail() below — Next
// dedupes identical fetches within one render, so this doesn't cost a
// second request and (importantly) doesn't touch the separate, non-cached
// view-count fetch that only getPartDetail makes.
export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/parts/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const { data: part } = await res.json();
    if (!part) return {};

    const lang = await getLang();
    const title = lang === "ur" ? (part.titleUr || part.title) : part.title;
    const image = partImage(part);
    const description = `${formatPrice(part.price, part.priceDisplay)} — ${partCategoryLabel(part.category, lang)}, ${titleCase(part.condition)} in ${titleCase(part.city)}`;

    return {
      title, // root layout's title.template appends "| HeavyWheels"
      description,
      alternates: { canonical: `/parts/${id}` },
      openGraph: { title, description, images: [{ url: image }], type: "website" },
      twitter: { card: "summary_large_image", title, description, images: [image] },
    };
  } catch {
    return {};
  }
}

async function getPartDetail(id) {
  try {
    const [partRes, featuredRes] = await Promise.all([
      fetch(`${SERVER_API_BASE_URL}/parts/${id}`, { next: { revalidate: 60 } }),
      fetch(`${SERVER_API_BASE_URL}/parts/featured?limit=3`, { next: { revalidate: 60 } }),
      // View count is a mutation — never cache it, so every visit still counts.
      fetch(`${SERVER_API_BASE_URL}/parts/${id}/view`, { method: "POST", cache: "no-store" }).catch(() => null),
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
          <h1 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("partd.notFound")}</h1>
          <p className="mt-2 text-[var(--hw-text-secondary)]">
            {t("partd.notFoundBody")}
          </p>
          <Link
            href="/parts"
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]"
          >
            {t("partd.backToParts")}
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
  const descPrimary = (lang === "ur" ? (descUr || descEn) : descEn) || t("partd.noDescription");
  const descSecondary = lang === "ur" ? descEn : descUr;
  const showLabel = lang === "ur" ? t("listing.showEnglish") : t("listing.showUrdu");
  const hideLabel = lang === "ur" ? t("listing.showUrdu") : t("listing.showEnglish");

  const specs = [
    [t("partd.category"), partCategoryLabel(part.category, lang), "layers"],
    ...(part.subcategory ? [[t("partd.part"), partSubcategoryLabel(part.subcategory), "wrench"]] : []),
    [t("partd.condition"), titleCase(part.condition), "tag"],
    ...(part.partType ? [[t("partd.type"), partTypeLabel(part.partType), "box"]] : []),
    ...(part.warranty && part.warranty !== "none" ? [[t("partd.warranty"), warrantyLabel(part.warranty), "shield"]] : []),
    [t("partd.make"), titleCase(part.make || "not listed"), "badge"],
    [t("partd.model"), part.model || t("partd.notListed"), "hash"],
    [t("partd.quantity"), part.quantity || 1, "box"],
    [t("partd.city"), titleCase(part.city), "pin"],
    [t("partd.area"), part.area || t("partd.notListed"), "pin"],
    [t("partd.province"), titleCase(part.province || "not listed"), "pin"],
  ];

  const quickSpecs = [
    [t("partd.condition"), titleCase(part.condition)],
    [t("partd.make"), titleCase(part.make || "—")],
    [t("partd.model"), part.model || "—"],
    [t("partd.quantity"), part.quantity || 1],
  ];

  const breadcrumbItems = [
    { name: "HeavyWheels", path: "" },
    { name: t("nav.parts"), path: "/parts" },
    { name: partCategoryLabel(part.category, lang), path: `/parts?category=${part.category}` },
    { name: title, path: `/parts/${part._id}` },
  ];

  return (
    <main className="hw-container py-3 sm:py-6 lg:py-10">
      {/* Product + BreadcrumbList JSON-LD — the visible breadcrumb below
          mirrors this, so a reader and a crawler get the same hierarchy. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            productJsonLd({
              name: title,
              description: descPrimary,
              image: partImage(part),
              path: `/parts/${part._id}`,
              price: part.price,
              condition: part.condition,
              brand: titleCase(part.make),
              status: part.status,
            }),
            breadcrumbJsonLd(breadcrumbItems),
          ]),
        }}
      />

      <ListingTopBar title={title} />

      <div className="mb-6 hidden items-center gap-1.5 text-sm text-[var(--hw-text-muted)] lg:flex">
        <Link href="/" className="hover:text-[var(--hw-orange)]">{t("nav.home")}</Link>
        <span aria-hidden>/</span>
        <Link href="/parts" className="hover:text-[var(--hw-orange)]">{t("nav.parts")}</Link>
        <span aria-hidden>/</span>
        <Link href={`/parts?category=${part.category}`} className="hover:text-[var(--hw-orange)]">{partCategoryLabel(part.category, lang)}</Link>
        <span aria-hidden>/</span>
        <span className="truncate text-[var(--hw-text-secondary)]">{title}</span>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <section className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
          <VehicleGallery
            images={part.images}
            title={title}
            fallbackImage={partImage(part)}
          />

          <div className="mt-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:mt-4 sm:p-5">
            <div className="mb-2 hidden justify-end lg:flex">
              <ShareMenu title={title} iconOnly />
            </div>
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
                  <p className="mt-0.5 text-[10px] font-bold uppercase text-[var(--hw-text-secondary)] sm:text-xs">{t("partd.negotiable")}</p>
                ) : null}
              </div>
            </div>

            {part.status === "sold" ? (
              <p className="mt-2.5 flex items-center gap-2 rounded-lg border border-[var(--hw-orange)] bg-[var(--hw-soft-panel)] px-3 py-2 text-[13px] font-black text-[var(--hw-orange)] sm:mt-4 sm:text-sm">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" />
                </svg>
                {t("listing.soldNotice")}
              </p>
            ) : null}

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
            <p className="text-[10px] font-black uppercase text-[var(--hw-orange)] sm:text-xs">{t("partd.seller")}</p>
            <PlanBadge plan={part.seller?.plan} size="sm" hideFree />
          </div>
          <h2 className="mt-1.5 text-base font-black text-[var(--hw-text-primary)] sm:mt-2 sm:text-xl">{seller.name || t("partd.seller")}</h2>
          <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:mt-1 sm:text-sm">
            {titleCase(seller.city || part.city)} · {seller.role ? titleCase(seller.role) : t("partd.partsSeller")}
          </p>
          {seller?._id || part.sellerId ? (
            <Link href={`/sellers/${seller?._id || part.sellerId}`} className="mt-1 inline-block text-[11px] font-bold text-[var(--hw-orange)] hover:underline sm:text-sm">
              {t("listing.viewProfile")}
            </Link>
          ) : null}
          <div className="mt-3.5 sm:mt-5">
            <SellerContact listingId={part._id} listingType="part" redirectTo={`/parts/${part._id}`} sellerId={seller?._id || part.sellerId} />
          </div>
          <div className="mt-3.5 rounded-lg bg-[var(--hw-bg-deep)] p-3 text-[11px] leading-5 text-[var(--hw-text-secondary)] sm:mt-5 sm:p-4 sm:text-sm sm:leading-6">
            {t("partd.safetyNote")}
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

          <Panel title={t("partd.details")}>
            <SpecGrid specs={specs} />
          </Panel>
        </div>
      </div>

      <section className="mt-6 sm:mt-10">
        <Comments listingId={part._id} listingType="part" sellerId={seller?._id || part.sellerId} />
      </section>

      {related.length ? (
        <section className="mt-6 sm:mt-10">
          <h2 className="mb-3 text-[17px] font-black text-[var(--hw-text-primary)] sm:mb-5 sm:text-2xl">{t("partd.featuredParts")}</h2>
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
