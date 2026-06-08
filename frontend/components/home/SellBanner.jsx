import Link from "next/link";

export default function SellBanner() {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-[var(--hw-orange-border)] bg-gradient-to-r from-[var(--hw-orange-dim)] via-[var(--hw-bg-card)] to-[var(--hw-orange-dim)]">

            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[var(--hw-orange)] opacity-[0.06] blur-3xl" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-12">

                {/* LEFT — Text */}
                <div className="text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                        Ready to Sell Your Vehicle?
                    </h2>
                    <p className="mt-2 text-[var(--hw-text-secondary)] max-w-md">
                        Post your ad for free and reach thousands of buyers across Pakistan.
                        Featured listings get 5x more views.
                    </p>
                </div>

                {/* RIGHT — CTA */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/post-ad"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--hw-orange)] hover:bg-[var(--hw-orange-dark)] text-white font-semibold px-8 py-3 text-sm transition-all hover:shadow-lg hover:shadow-orange-500/20"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Post Free Ad
                    </Link>

                    <Link
                        href="/post-ad?featured=true"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--hw-orange)] text-[var(--hw-orange)] hover:bg-[var(--hw-orange)] hover:text-white font-semibold px-8 py-3 text-sm transition-all"
                    >
                        ⭐ Go Featured
                    </Link>
                </div>
            </div>
        </section>
    );
}
