export const metadata = {
  title: "Contact Us — HeavyWheels",
  description: "Get in touch with the HeavyWheels team by email, phone, or WhatsApp.",
};

// Single source of truth for contact details (kept in sync with the footer).
const EMAIL = "info@heavywheels.pk";
const PHONE_DISPLAY = "+92 300 0000000";
const PHONE_INTL = "923000000000"; // for tel: and wa.me links

const CHANNELS = [
  {
    icon: "✉️",
    label: "Email",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
  },
  {
    icon: "📞",
    label: "Phone",
    value: PHONE_DISPLAY,
    href: `tel:+${PHONE_INTL}`,
  },
  {
    icon: "💬",
    label: "WhatsApp",
    value: PHONE_DISPLAY,
    href: `https://wa.me/${PHONE_INTL}`,
  },
];

export default function ContactPage() {
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Support</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Contact Us</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">
          We&apos;re here to help. Reach the HeavyWheels team through any of the channels below.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {CHANNELS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.label === "WhatsApp" ? "_blank" : undefined}
              rel={c.label === "WhatsApp" ? "noopener noreferrer" : undefined}
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
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Office</h2>
          <p className="mt-3">Karachi, Pakistan</p>
          <p className="mt-1 text-sm text-[var(--hw-text-muted)]">
            Support hours: Monday – Saturday, 9:00 AM – 7:00 PM (PKT)
          </p>
        </div>

        <p className="mt-6 text-sm text-[var(--hw-text-muted)]">
          Buying or selling? You can also contact a seller directly from any listing using the
          Call or WhatsApp buttons after signing in.
        </p>
      </div>
    </main>
  );
}
