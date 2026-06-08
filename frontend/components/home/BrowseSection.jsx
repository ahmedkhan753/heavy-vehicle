"use client";

import Link from "next/link";
import { VEHICLE_CATEGORIES } from "@/lib/constants";
import { useLanguage } from "@/Context/LanguageContext";

const ICONS = {
    truck: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0h2m4 0h1a1 1 0 001-1v-4.586a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0016.586 6H14" />
        </svg>
    ),
    bus: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17a2 2 0 11-4 0 2 2 0 014 0zM20 17a2 2 0 11-4 0 2 2 0 014 0zM4 15V5a2 2 0 012-2h12a2 2 0 012 2v10M4 9h16" />
        </svg>
    ),
    trailer: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM3 13h18V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6z" />
        </svg>
    ),
    construction: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
    ),
    tractor: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 15V8a1 1 0 011-1h4l2 5h3m-9 0h7m-1 0a2 2 0 012 2" />
        </svg>
    ),
};

export default function BrowseSection() {
    const { lang } = useLanguage();
    return (
        <section>
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                    Browse by Category
                </h2>
                <Link
                    href="/vehicles"
                    className="text-sm text-[var(--hw-orange)] hover:underline"
                >
                    View All →
                </Link>
            </div>

            {/* CATEGORY GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {VEHICLE_CATEGORIES.filter((category) => category.value !== "other").map((category) => (
                    <Link key={category.value} href={`/vehicles?category=${category.value}`}>
                        <div className="group flex flex-col items-center gap-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 transition hover:-translate-y-1 hover:border-[var(--hw-orange)] hover:shadow-lg hover:shadow-orange-500/5 cursor-pointer">
                            <div className="text-[var(--hw-text-muted)] group-hover:text-[var(--hw-orange)] transition">
                                {ICONS[category.icon] || ICONS.truck}
                            </div>
                            <span className="text-center text-sm font-medium text-[var(--hw-text-secondary)] group-hover:text-white transition">
                                {lang === "ur" && category.urdu ? category.urdu : category.label}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
