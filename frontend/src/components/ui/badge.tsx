import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const variants = {
    default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/95",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
    outline: "text-foreground border-border",
    success: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
    warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  return <div className={combinedClassName} {...props} />;
}
