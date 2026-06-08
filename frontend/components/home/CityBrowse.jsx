"use client";

import Link from "next/link";

const CITIES = [
    "Karachi",
    "Lahore",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Peshawar",
    "Multan",
    "Quetta",
    "Hyderabad",
    "Sialkot",
    "Gujranwala",
    "Abbottabad",
];

export default function CitySection() {
    return (
        <section className="mx-auto max-w-7xl px-4 py-12">

            {/* HEADER */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white">
                    Browse Trucks by City
                </h2>
                <p className="text-sm text-[var(--hw-text-secondary)] mt-1">
                    Find heavy vehicles available near your location.
                </p>
            </div>

            {/* GRID */}
            <div className="
                grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6
                gap-3
            ">
                {CITIES.map((city) => (
                    <Link
                        key={city}
                        href={`/vehicles?city=${city.toLowerCase()}`}
                    >
                        <div className="
                            group text-center rounded-lg
                            border border-[var(--hw-border-default)]
                            bg-[var(--hw-bg-card)]
                            py-3 px-2
                            transition
                            hover:border-[var(--hw-orange)]
                            hover:bg-[var(--hw-bg-elevated)]
                        ">

                            <div className="
                                text-sm font-semibold text-[var(--hw-text-secondary)]
                                group-hover:text-[var(--hw-orange)]
                            ">
                                {city}
                            </div>

                            <div className="text-[10px] text-gray-500 mt-1">
                                View listings
                            </div>

                        </div>
                    </Link>
                ))}
            </div>

            {/* SEO STRIP */}
            <div className="
                mt-10 rounded-xl
                border border-[var(--hw-border-default)]
                bg-[#0d1220]
                p-5
            ">
                <h3 className="text-white font-bold text-sm">
                    Pakistan Heavy Vehicle Marketplace Coverage
                </h3>

                <p className="text-xs text-[var(--hw-text-secondary)] mt-2 leading-relaxed">
                    Browse thousands of trucks, trailers, dumpers, and machinery listings across major cities in Pakistan.
                    Find verified sellers in Karachi, Lahore, Islamabad, and more with trusted marketplace support.
                </p>
            </div>

        </section>
    );
}