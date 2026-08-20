import Link from "next/link";
import Image from "next/image";
import { SERVER_API_BASE_URL } from "@/lib/api";
import { cityLabel } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { getT, getLang } from "@/lib/i18n-server";
import { businessCategoryLabel, businessCategoryIcon } from "@/lib/businesses";
import { Icon } from "@/components/listing/ListingBits";

export const revalidate = 60;

async function getBusiness(id) {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/businesses/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  } catch {
    return { data: null };
  }
}

export default async function BusinessProfilePage({ params }) {
  const { id } = await params;
  const result = await getBusiness(id);
  const biz = result.data;
  const t = await getT();
  const lang = await getLang();

  if (!biz) {
    return (
      <main className="hw-container py-16">
        <div className="rounded-xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center sm:p-10">
          <h1 className="text-xl font-black text-[var(--hw-text-primary)] sm:text-2xl">{t("biz.notFound")}</h1>
          <Link href="/businesses" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:text-sm">
            {t("biz.backToDirectory")}
          </Link>
        </div>
      </main>
    );
  }

  const initial = (biz.businessName || "?").trim().charAt(0).toUpperCase();
  const wa = (biz.whatsapp || biz.phone || "").replace(/[^0-9]/g, "");

  return (
    <main className="hw-container py-4 sm:py-8 lg:py-10">
      {biz.approvalStatus !== "approved" ? (
        <p className="mb-3 rounded-lg border border-[var(--hw-orange)] bg-[var(--hw-soft-panel)] px-3 py-2 text-[12px] font-bold text-[var(--hw-orange)] sm:text-sm">
          {biz.approvalStatus === "pending" ? t("bizForm.pendingTitle") : t("bizForm.rejectedTitle")}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        <div
          className="relative h-20 sm:h-28"
          style={{ background: "linear-gradient(120deg, color-mix(in srgb, var(--hw-orange) 28%, var(--hw-bg-deep)), var(--hw-bg-deep))" }}
        >
          {biz.coverImage?.url ? <Image src={biz.coverImage.url} alt="" fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" /> : null}
          <div className="absolute inset-0 hw-subtle-grid opacity-40" />
        </div>

        <div className="p-3.5 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--hw-orange)] text-lg font-black text-[var(--hw-text-inverse)] sm:h-20 sm:w-20 sm:text-2xl">
              {biz.logo?.url
                ? <Image src={biz.logo.url} alt="" width={80} height={80} className="h-full w-full object-cover" />
                : initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[10px] font-black uppercase text-[var(--hw-orange)] sm:text-xs">
                  {businessCategoryLabel(biz.category, lang)}
                </p>
                {biz.featured ? (
                  <span className="rounded-full bg-[var(--hw-orange)] px-2 py-0.5 text-[9px] font-black uppercase text-[var(--hw-text-inverse)]">
                    ★ {t("biz.featured")}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-0.5 truncate text-lg font-black text-[var(--hw-text-primary)] sm:text-3xl">{biz.businessName}</h1>
            </div>
          </div>

          {biz.tagline ? (
            <p className="mt-2 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-base">{biz.tagline}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
            <Fact icon="pin">{cityLabel(biz.city, lang)}{biz.area ? ` · ${biz.area}` : ""}</Fact>
            <Fact icon={businessCategoryIcon(biz.category)}>{businessCategoryLabel(biz.category, lang)}</Fact>
            {biz.establishedYear ? <Fact icon="calendar">{biz.establishedYear}</Fact> : null}
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:gap-3">
            {biz.phone ? (
              <a href={`tel:${biz.phone}`} className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--hw-green)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:text-sm">
                {t("contact.call")}
              </a>
            ) : null}
            {wa ? (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] px-5 text-[13px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] sm:text-sm">
                {t("contact.whatsapp")}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-3 grid gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
          <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("biz.about")}</h2>
          <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-base sm:leading-7">
            {biz.description || biz.tagline || "—"}
          </p>

          {biz.photos?.length ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {biz.photos.slice(0, 6).map((p) => (
                <div key={p.publicId || p.url} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[var(--hw-bg-deep)]">
                  <Image src={p.url} alt="" fill sizes="180px" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="h-fit min-w-0 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
          <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("biz.contact")}</h2>
          <dl className="mt-3 grid gap-2 text-[12px] sm:text-sm">
            <Row label={t("bizForm.address")} value={biz.address} fallback="—" />
            <Row label={t("bizForm.workingHours")} value={biz.workingHours} fallback="—" />
            <Row label={t("bizForm.city")} value={titleCase(biz.city)} />
            {biz.website ? <Row label={t("bizForm.website")} value={biz.website} /> : null}
          </dl>
        </aside>
      </section>
    </main>
  );
}

function Fact({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] px-2 py-1 text-[11px] font-bold text-[var(--hw-text-secondary)] sm:px-2.5 sm:text-xs">
      <Icon name={icon} className="h-3.5 w-3.5 shrink-0 text-[var(--hw-orange)]" />
      {children}
    </span>
  );
}

function Row({ label, value, fallback }) {
  if (!value && !fallback) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--hw-border-subtle)] pb-2 last:border-b-0 last:pb-0">
      <dt className="shrink-0 text-[var(--hw-text-muted)]">{label}</dt>
      <dd className="break-words text-end font-bold text-[var(--hw-text-primary)]">{value || fallback}</dd>
    </div>
  );
}
