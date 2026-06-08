import Link from "next/link";

export default function VehicleCard({ vehicle }) {
    const {
        id,
        title,
        price,
        city,
        km,
        year,
        img,
        featured = false,
        verified = false,
    } = vehicle;

    return (
        <Link href={`/vehicle/${id}`}>
            <div className="group relative overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] transition hover:-translate-y-1 hover:border-[var(--hw-orange)] hover:shadow-lg hover:shadow-orange-500/5">

                {/* IMAGE */}
                <div className="relative h-44 overflow-hidden">
                    <img
                        src={img}
                        alt={title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                    />

                    {/* GRADIENT OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                    {/* BADGES */}
                    <div className="absolute top-2 left-2 flex gap-2">
                        {featured && (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--hw-orange)] text-white font-bold">
                                FEATURED
                            </span>
                        )}
                        {verified && (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-green-600 text-white font-bold">
                                VERIFIED
                            </span>
                        )}
                    </div>

                    {/* YEAR PILL */}
                    {year && (
                        <div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded">
                            {year}
                        </div>
                    )}
                </div>

                {/* CONTENT */}
                <div className="p-3">
                    <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-[var(--hw-orange)] transition">
                        {title}
                    </h3>

                    <div className="mt-2 text-[var(--hw-orange)] font-bold text-lg">
                        {price}
                    </div>

                    {/* META */}
                    <div className="mt-2 flex justify-between text-xs text-[var(--hw-text-secondary)]">
                        <span>{city}</span>
                        <span>{km}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
