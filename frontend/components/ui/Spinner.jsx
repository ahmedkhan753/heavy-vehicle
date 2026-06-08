"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
};

const Spinner = ({ size = "md", className }) => {
    return (
        <span
            className={cn(
                "inline-block animate-spin rounded-full border-[var(--hw-orange)] border-t-transparent",
                sizes[size],
                className
            )}
        />
    );
};

export default Spinner;