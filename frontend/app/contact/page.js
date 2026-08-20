import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the HeavyWheels team by email, phone, or WhatsApp.",
};

// Single source of truth for contact details (kept in sync with the footer).
const EMAIL = "info@heavywheels.pk";
const PHONE_DISPLAY = "+92 300 0000000";
const PHONE_INTL = "923000000000"; // for tel: and wa.me links

export default async function ContactPage() {
  const t = await getT();

  const CHANNELS = [
    { icon: "✉️", key: "email", label: t("contact.email"), value: EMAIL, href: `mailto:${EMAIL}` },
    { icon: "📞", key: "phone", label: t("contact.phone"), value: PHONE_DISPLAY, href: `tel:+${PHONE_INTL}` },
    { icon: "💬", key: "whatsapp", label: t("contact.whatsappLabel"), value: PHONE_DISPLAY, href: `https://wa.me/${PHONE_INTL}` },
  ];

  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("contact.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("contact.title")}</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">{t("contact.subtitle")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {CHANNELS.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target={c.key === "whatsapp" ? "_blank" : undefined}
              rel={c.key === "whatsapp" ? "noopener noreferrer" : undefined}
              className="group rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 transition hover:-translate-y-1 hover:border-[var(--hw-orange)]"
            >
              <div className="text-3xl mb-3">{c.icon}</div>
              <h2 className="text-sm font-black uppercase text-[var(--hw-text-muted)]">{c.label}</h2>
              <p className="mt-1 text-sm font-bold text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)]">
                {c.value}
              </p>
            </a>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 text-[var(--hw-text-secondary)] leading-7">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("contact.officeTitle")}</h2>
          <p className="mt-3">{t("contact.officeCity")}</p>
          <p className="mt-1 text-sm text-[var(--hw-text-muted)]">{t("contact.officeHours")}</p>
        </div>

        <p className="mt-6 text-sm text-[var(--hw-text-muted)]">{t("contact.sellerNote")}</p>
      </div>
    </main>
  );
}
