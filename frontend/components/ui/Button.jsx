"use client";

import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const variants = {
  primary:
    "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)] hover:bg-[var(--hw-amber)]",
  secondary:
    "border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]",
  ghost:
    "text-[var(--hw-text-secondary)] hover:bg-[var(--hw-bg-elevated)] hover:text-[var(--hw-text-primary)]",
  danger: "bg-[var(--hw-red)] text-white hover:opacity-90",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-[var(--hw-orange)] focus:ring-offset-2 focus:ring-offset-[var(--hw-bg-base)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {leftIcon && !loading ? <span className="flex items-center">{leftIcon}</span> : null}
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        children
      )}
      {rightIcon && !loading ? <span className="flex items-center">{rightIcon}</span> : null}
    </button>
  )
);

Button.displayName = "Button";

export default Button;
