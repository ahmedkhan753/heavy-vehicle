"use client";

import { useState } from "react";
import Link from "next/link";

const SEARCH_TABS = [
    { id: "used", label: "Used Trucks" },
    { id: "new", label: "New Trucks" },
    { id: "machinery", label: "Machinery" },
    { id: "parts", label: "Parts" },
];

const MAKES = ["All Makes", "Hino", "FAW", "Isuzu", "Volvo", "Mercedes", "Shacman"];
const TYPES = ["All Types", "Prime Mover", "Dumper", "Container", "Tanker", "Excavator"];
const CITIES = ["All Cities", "Karachi", "Lahore", "Islamabad", "Peshawar"];
const BUDGETS = ["Any Budget", "Under 20L", "20L–50L", "50L–1Cr", "1Cr+"];

export default function HeroSection() {
    const [tab, setTab] = useState("used");

    const [filters, setFilters] = useState({
        keyword: "",
        make: "",
        type: "",
        city: "",
        budget: "",
    });

    const handleChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <section className="relative overflow-hidden border-b border-[var(--hw-border-subtle)] bg-[var(--hw-bg-base)]">

            {/* Background Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1c] via-[#0d1220] to-[#070b14]" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,#f97316,transparent_40%)]" />

            <div className="relative mx-auto max-w-7xl px-4 py-16">

                {/* HEADLINE */}
                <div className="text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
                        Buy & Sell <span className="text-[var(--hw-orange)]">Heavy Vehicles</span>
                    </h1>
                    <p className="mt-3 text-sm md:text-base text-[var(--hw-text-secondary)]">
                        Pakistan’s trusted marketplace for trucks, trailers & machinery
                    </p>
                </div>

                {/* SEARCH CARD */}
                <div className="mt-10 mx-auto max-w-4xl rounded-2xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] shadow-xl">

                    {/* Tabs */}
                    <div className="flex border-b border-[var(--hw-border-subtle)]">
                        {SEARCH_TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex-1 py-3 text-sm font-semibold transition ${tab === t.id
                                    ? "text-[var(--hw-orange)] border-b-2 border-[var(--hw-orange)]"
                                    : "text-[var(--hw-text-secondary)]"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-4">

                        {/* Keyword */}
                        <input
                            value={filters.keyword}
                            onChange={(e) => handleChange("keyword", e.target.value)}
                            placeholder="Search trucks..."
                            className="md:col-span-2 rounded-lg bg-[var(--hw-bg-elevated)] px-3 py-2 text-sm outline-none border border-[var(--hw-border-subtle)]"
                        />

                        {/* Make */}
                        <select
                            value={filters.make}
                            onChange={(e) => handleChange("make", e.target.value)}
                            className="rounded-lg bg-[var(--hw-bg-elevated)] px-2 py-2 text-sm"
                        >
                            {MAKES.map((m) => <option key={m}>{m}</option>)}
                        </select>

                        {/* Type */}
                        <select
                            value={filters.type}
                            onChange={(e) => handleChange("type", e.target.value)}
                            className="rounded-lg bg-[var(--hw-bg-elevated)] px-2 py-2 text-sm"
                        >
                            {TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>

                        {/* City */}
                        <select
                            value={filters.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            className="rounded-lg bg-[var(--hw-bg-elevated)] px-2 py-2 text-sm"
                        >
                            {CITIES.map((c) => <option key={c}>{c}</option>)}
                        </select>

                        {/* Budget */}
                        <select
                            value={filters.budget}
                            onChange={(e) => handleChange("budget", e.target.value)}
                            className="rounded-lg bg-[var(--hw-bg-elevated)] px-2 py-2 text-sm"
                        >
                            {BUDGETS.map((b) => <option key={b}>{b}</option>)}
                        </select>
                    </div>

                    {/* CTA */}
                    <div className="p-4 pt-0">
                        <Link
                            href="/vehicles"
                            className="block w-full rounded-lg bg-[var(--hw-orange)] py-3 text-center text-sm font-bold text-white hover:opacity-90"
                        >
                            Search Vehicles
                        </Link>
                    </div>
                </div>

                {/* QUICK STATS */}
                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <Stat label="Active Listings" value="3,800+" />
                    <Stat label="Verified Sellers" value="1,200+" />
                    <Stat label="Cities Covered" value="35+" />
                    <Stat label="Free Ads" value="Always" />
                </div>
            </div>
        </section>
    );
}

function Stat({ label, value }) {
    return (
        <div>
            <div className="text-xl font-bold text-[var(--hw-orange)]">{value}</div>
            <div className="text-xs text-[var(--hw-text-secondary)] mt-1">{label}</div>
        </div>
    );
}