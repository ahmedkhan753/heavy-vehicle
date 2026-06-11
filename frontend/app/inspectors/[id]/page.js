import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { cityLabel } from "@/lib/constants";
import { getT, getLang } from "@/lib/i18n-server";

export const revalidate = 60;

async function getInspector(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/inspectors/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export default async function InspectorDetailPage({ params }) {
  const { id } = await params;
  const ins = await getInspector(id);
  const t = await getT();
  const lang = await getLang();

  if (!ins) {
    return (
      <main className="hw-container py-16">
        <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
          <h1 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("insp.notFound")}</h1>
          <Link href="/inspectors" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("insp.back")}</Link>
        </div>
      </main>
    );
  }

  const wa = (ins.whatsapp || ins.phone || "").replace(/[^0-9]/g, "");

  return (
    <main className="hw-container py-10">
      <div className="mb-6 text-sm text-[var(--hw-text-muted)]">
        <Link href="/inspectors" className="hover:text-[var(--hw-orange)]">{t("insp.crumb")}</Link>
        <span> / {ins.displayName}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[var(--hw-text-primary)]">{ins.displayName}</h1>
            {ins.isVerified ? <span className="rounded-full bg-[var(--hw-green)] px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Verified</span> : null}
          </div>
          <p className="mt-2 text-sm text-[var(--hw-text-muted)]">
            {cityLabel(ins.city, lang)} · {ins.type === "company" ? t("insp.inspectionCompany") : t("insp.individualInspector")}
            {ins.experienceYears ? ` · ${ins.experienceYears} ${t("insp.yrsExp")}` : ""}
          </p>

          {ins.bio ? <p className="mt-5 whitespace-pre-line leading-7 text-[var(--hw-text-secondary)]">{ins.bio}</p> : null}

          {ins.certifications ? (
            <div className="mt-5">
              <h3 className="text-sm font-black text-[var(--hw-text-primary)]">{t("insp.certifications")}</h3>
              <p className="mt-1 text-sm text-[var(--hw-text-secondary)]">{ins.certifications}</p>
            </div>
          ) : null}

          {ins.specializations?.length ? (
            <div className="mt-5">
              <h3 className="text-sm font-black text-[var(--hw-text-primary)]">{t("insp.specializations")}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {ins.specializations.map((s) => (
                  <span key={s} className="rounded-full bg-[var(--hw-soft-panel)] px-3 py-1 text-xs font-bold text-[var(--hw-text-secondary)]">{titleCase(s)}</span>
                ))}
              </div>
            </div>
          ) : null}

          {ins.serviceAreas?.length ? (
            <div className="mt-5">
              <h3 className="text-sm font-black text-[var(--hw-text-primary)]">{t("insp.serviceAreas")}</h3>
              <p className="mt-1 text-sm text-[var(--hw-text-secondary)]">{ins.serviceAreas.map((c) => cityLabel(c, lang)).join(", ")}</p>
            </div>
          ) : null}
        </section>

        <aside className="h-fit rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 lg:sticky lg:top-24">
          <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("insp.feeLabel")}</p>
          <p className="mt-1 text-3xl font-black text-[var(--hw-orange)]">{formatPrice(ins.inspectionFee)}</p>
          {ins.feeNote ? <p className="text-xs text-[var(--hw-text-muted)]">{ins.feeNote}</p> : null}

          <div className="mt-5 grid gap-3">
            {ins.phone ? (
              <a href={`tel:${ins.phone}`} className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--hw-green)] text-sm font-black text-[var(--hw-text-inverse)]">{t("insp.callInspector")}</a>
            ) : null}
            {wa ? (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]">{t("contact.whatsapp")}</a>
            ) : null}
          </div>

          <p className="mt-5 rounded-lg bg-[var(--hw-bg-deep)] p-4 text-xs leading-6 text-[var(--hw-text-secondary)]">{t("insp.safetyNote")}</p>
        </aside>
      </div>
    </main>
  );
}
