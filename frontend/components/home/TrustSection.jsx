const TRUST_ITEMS = [
    {
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: "Verified Sellers",
        desc: "Every dealer goes through our verification process so you can buy with confidence.",
    },
    {
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
        title: "Secure Payments",
        desc: "Protected transactions with escrow support for high-value heavy vehicles.",
    },
    {
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        title: "Inspection Reports",
        desc: "Get certified vehicle inspection reports before making your purchase decision.",
    },
    {
        icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        title: "24/7 Support",
        desc: "Our team is always available to help you with buying, selling, or any disputes.",
    },
];

export default function TrustSection() {
    return (
        <section>
            {/* HEADER */}
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white">
                    Why Choose HeavyWheels?
                </h2>
                <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">
                    Trusted by fleet owners and dealers across Pakistan
                </p>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TRUST_ITEMS.map((item) => (
                    <div
                        key={item.title}
                        className="group rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 text-center transition hover:border-[var(--hw-orange-border)] hover:bg-[var(--hw-bg-elevated)]"
                    >
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--hw-orange-dim)] text-[var(--hw-orange)] mb-4 group-hover:scale-110 transition">
                            {item.icon}
                        </div>
                        <h3 className="font-semibold text-white mb-2">
                            {item.title}
                        </h3>
                        <p className="text-xs text-[var(--hw-text-secondary)] leading-relaxed">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
