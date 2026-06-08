"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Select = React.forwardRef(
    (
        {
            label,
            options = [],
            error,
            helperText,
            className,
            containerClassName,
            placeholder = "Select an option",
            ...props
        },
        ref
    ) => {
        return (
            <div className={cn("w-full", containerClassName)}>

                {/* LABEL */}
                {label && (
                    <label className="mb-2 block text-sm font-medium text-[var(--hw-text-secondary)]">
                        {label}
                    </label>
                )}

                {/* SELECT WRAPPER */}
                <div
                    className={cn(
                        "relative rounded-xl border transition-all duration-200",
                        "bg-[var(--hw-bg-input)]",
                        error
                            ? "border-[var(--hw-red)]"
                            : "border-[var(--hw-border-default)] focus-within:border-[var(--hw-orange)]",
                        "focus-within:ring-1 focus-within:ring-[var(--hw-orange)]"
                    )}
                >
                    <select
                        ref={ref}
                        className={cn(
                            "w-full appearance-none bg-transparent px-3 py-2.5 text-sm outline-none",
                            "text-[var(--hw-text-primary)]",
                            "placeholder:text-[var(--hw-text-faint)]",
                            className
                        )}
                        {...props}
                    >
                        {/* Placeholder */}
                        <option value="" disabled>
                            {placeholder}
                        </option>

                        {/* Options */}
                        {options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    {/* Custom Arrow */}
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hw-text-muted)]">
                        ▼
                    </span>
                </div>

                {/* ERROR / HELPER TEXT */}
                {(error || helperText) && (
                    <p
                        className={cn(
                            "mt-1 text-xs",
                            error
                                ? "text-[var(--hw-red)]"
                                : "text-[var(--hw-text-muted)]"
                        )}
                    >
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = "Select";

export default Select;