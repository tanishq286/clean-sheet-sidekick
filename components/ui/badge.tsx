import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
        secondary: "border-white/10 bg-white/5 text-muted-foreground",
        outline: "border-white/15 text-foreground",
        warning: "border-amber-400/30 bg-amber-500/15 text-amber-300",
        danger: "border-rose-400/30 bg-rose-500/15 text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
