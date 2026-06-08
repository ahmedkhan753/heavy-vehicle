"use client";

import { useToast } from "@/Context/ToastContext";

/**
 * HeavyWheels Services
 * ────────────────────
 * These services are not built yet (no backend / no pages). Instead of
 * linking to routes that 404, each card is marked "Coming Soon" and shows
 * a toast on click. Re-enable a card by giving it an `href` and removing it
 * from the coming-soon treatment once the feature ships.
 */
const SERVICES = [
    {
        icon: "🔍",
        title: "Vehicle Inspection",
        desc: "Get your truck inspected by certified experts before buying.",
    },
    {
        icon: "💰",
        title: "Loan Calculator",
        desc: "Estimate monthly installments for truck financing options.",
    },
    {
        icon: "📄",
        title: "Ownership Transfer",
        desc: "Hassle-free documentation and transfer assistance.",
    },
    {
        icon: "🛡️",
        title: "Warranty Program",
        desc: "6-month warranty on selected verified vehicles.",
    },
];

export default function ServicesSection() {
    const toast = useToast();

    return (
        <section className="mx-auto max-w-7xl px-4 py-12">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                    HeavyWheels Services
                </h2>

                <span className="text-sm text-[var(--hw-text-muted)]">
                    Coming soon
                </span>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {SERVICES.map((s) => (
                    <button
                        key={s.title}
                        type="button"
                        onClick={() => toast.info(`${s.title} is coming soon!`)}
                        className="
                            group relative h-full w-full text-left cursor-default
                            rounded-xl
                            border border-[var(--hw-border-default)]
                            bg-[var(--hw-bg-card)]
                            p-5
                            transition
                            hover:border-[var(--hw-border-strong)]
                        "
                    >
                        {/* COMING SOON BADGE */}
                        <span className="
                            absolute right-3 top-3
                            rounded-full
                            bg-[var(--hw-bg-elevated)]
                            px-2 py-0.5
                            text-[10px] font-bold uppercase tracking-wide
                            text-[var(--hw-text-muted)]
                        ">
                            Coming Soon
                        </span>

                        {/* ICON */}
                        <div className="text-3xl mb-3 opacity-70">
                            {s.icon}
                        </div>

                        {/* TITLE */}
                        <h3 className="text-sm font-bold text-white">
                            {s.title}
                        </h3>

                        {/* DESC */}
                        <p className="mt-2 text-xs text-[var(--hw-text-secondary)] leading-relaxed">
                            {s.desc}
                        </p>

                    </button>
                ))}

            </div>
        </section>
    );
}
