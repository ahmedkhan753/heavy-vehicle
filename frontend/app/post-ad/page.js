import PostAdForm from "@/components/post-ad/PostAdForm";
import { getT } from "@/lib/i18n-server";

export default async function PostAdPage() {
  const t = await getT();
  const steps = [
    ["1", t("postad.step.login"), t("postad.step.loginDesc")],
    ["2", t("postad.step.upload"), t("postad.step.uploadDesc")],
    ["3", t("postad.step.create"), t("postad.step.createDesc")],
    ["4", t("postad.step.publish"), t("postad.step.publishDesc")],
  ];

  return (
    <main className="hw-container py-10">
      <div className="mb-8">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("page.sell")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("postad.title")}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 lg:sticky lg:top-24">
          <div className="grid gap-3">
            {steps.map(([num, title, desc]) => (
              <div key={title} className="rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-4">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)]">{num}</span>
                  <div>
                    <h2 className="font-black text-[var(--hw-text-primary)]">{title}</h2>
                    <p className="mt-1 text-xs leading-5 text-[var(--hw-text-muted)]">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <PostAdForm />
      </div>
    </main>
  );
}
