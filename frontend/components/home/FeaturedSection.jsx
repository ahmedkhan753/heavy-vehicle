"use client";

import Link from "next/link";
import { useState } from "react";

const FEATURED = [
    {
        id: 1,
        title: "Hino 700 Series Prime Mover 2022",
        price: "1.85 Crore",
        city: "Karachi",
        km: "45,000 km",
        year: 2022,
        img: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800",
        featured: true,
        verified: true,
    },
    {
        id: 2,
        title: "FAW J6 Dumper 25T 2021",
        price: "95 Lakh",
        city: "Lahore",
        km: "62,000 km",
        year: 2021,
        img: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800",
        featured: true,
        verified: true,
    },
    {
        id: 3,
        title: "Isuzu ELF Flatbed 2024",
        price: "42 Lakh",
        city: "Islamabad",
        km: "0 km",
        year: 2024,
        img: "https://images.unsplash.com/photo-1519003300449-424ad0405076?w=800",
        featured: true,
        verified: false,
    },
    {
        id: 4,
        title: "Volvo FH16 Container Truck 2019",
        price: "2.4 Crore",
        city: "Karachi",
        km: "120,000 km",
        year: 2019,
        img: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800",
        featured: true,
        verified: true,
    },
];

export default function FeaturedSection() {
    const [hovered, setHovered] = useState(null);

    return (
        <section className="mx-auto max-w-7xl px-4 py-12">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                    Featured Listings
                </h2>

                <Link
                    href="/vehicles"
                    className="text-sm text-[var(--hw-orange)] hover:underline"
                >
                    View All →
                </Link>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {FEATURED.map((item) => (
                    <Link key={item.id} href={`/vehicle/${item.id}`}>
                        <div
                            onMouseEnter={() => setHovered(item.id)}
                            onMouseLeave={() => setHovered(null)}
                            className="
                                group relative overflow-hidden rounded-xl
                                border border-[var(--hw-border-default)]
                                bg-[var(--hw-bg-card)]
                                transition
                                hover:-translate-y-1 hover:border-[var(--hw-orange)]
                            "
                        >

                            {/* IMAGE */}
                            <div className="relative h-44 overflow-hidden">
                                <img
                                    src={item.img}
                                    alt={item.title}
                                    className={`h-full w-full object-cover transition duration-300 ${hovered === item.id ? "scale-110" : "scale-100"
                                        }`}
                                />

                                {/* DARK OVERLAY */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                                {/* BADGES */}
                                <div className="absolute top-2 left-2 flex gap-2">
                                    {item.featured && (
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--hw-orange)] text-white font-bold">
                                            FEATURED
                                        </span>
                                    )}
                                    {item.verified && (
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-green-600 text-white font-bold">
                                            VERIFIED
                                        </span>
                                    )}
                                </div>

                                {/* YEAR */}
                                <div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded">
                                    {item.year}
                                </div>
                            </div>

                            {/* CONTENT */}
                            <div className="p-3">

                                <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-[var(--hw-orange)]">
                                    {item.title}
                                </h3>

                                <div className="mt-2 text-[var(--hw-orange)] font-bold text-lg">
                                    {item.price}
                                </div>

                                {/* META */}
                                <div className="mt-2 flex justify-between text-xs text-[var(--hw-text-secondary)]">
                                    <span>{item.city}</span>
                                    <span>{item.km}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

            </div>
        </section>
    );
}