import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-neon/30 bg-neon/10 text-neon",
        electric: "border-electric/30 bg-electric/10 text-electric-soft",
        warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
        danger: "border-red-400/30 bg-red-400/10 text-red-300",
        muted: "border-white/10 bg-white/[0.05] text-muted-foreground",
        outline: "border-white/15 text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
