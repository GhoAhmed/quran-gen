import { cn } from "../../lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline";
    size?: "sm" | "md" | "lg";
}

const variantClasses: Record<string, string> = {
    primary:
        "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:bg-emerald-500/40",
    secondary: "bg-white/10 text-white hover:bg-white/15",
    ghost: "bg-transparent text-gray-300 hover:bg-white/5 hover:text-white",
    outline: "bg-transparent border border-white/15 text-white hover:bg-white/5",
};

const sizeClasses: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
};

export function Button({
    className,
    variant = "primary",
    size = "md",
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled}
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            {...props}
        />
    );
}