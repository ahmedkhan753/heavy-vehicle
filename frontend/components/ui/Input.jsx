"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Input = React.forwardRef(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            className,
            containerClassName,
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

                {/* INPUT WRAPPER */}
                <div
                    className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 transition-all duration-200",
                        "bg-[var(--hw-bg-input)]",
                        error
                            ? "border-[var(--hw-red)] focus-within:border-[var(--hw-red)]"
                            : "border-[var(--hw-border-default)] focus-within:border-[var(--hw-orange)]",
                        "focus-within:ring-1 focus-within:ring-[var(--hw-orange)]"
                    )}
                >
                    {/* LEFT ICON */}
                    {leftIcon && (
                        <span className="text-[var(--hw-text-muted)]">{leftIcon}</span>
                    )}

                    {/* INPUT */}
                    <input
                        ref={ref}
                        className={cn(
                            "w-full bg-transparent py-2.5 text-sm outline-none",
                            "placeholder:text-[var(--hw-text-faint)]",
                            "text-[var(--hw-text-primary)]",
                            className
                        )}
                        {...props}
                    />

                    {/* RIGHT ICON */}
                    {rightIcon && (
                        <span className="text-[var(--hw-text-muted)]">{rightIcon}</span>
                    )}
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

Input.displayName = "Input";

export default Input;