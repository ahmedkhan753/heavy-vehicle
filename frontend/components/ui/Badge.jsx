export default function Badge({ children, variant = "default", className = "" }) {
    const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide";

    const variants = {
        default: "bg-[var(--hw-bg-elevated)] text-[var(--hw-text-secondary)] border border-[var(--hw-border-default)]",
        orange: "bg-[var(--hw-orange)] text-white",
        green: "bg-green-600 text-white",
        outline: "border border-[var(--hw-orange-border)] text-[var(--hw-orange)] bg-[var(--hw-orange-dim)]",
    };

    return (
        <span className={`${base} ${variants[variant] || variants.default} ${className}`}>
            {children}
        </span>
    );
}
