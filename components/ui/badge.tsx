import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700",
        secondary: "border-black/10 bg-black/[0.04] text-muted-foreground",
        outline: "border-black/15 text-foreground",
        warning: "border-amber-500/30 bg-amber-500/15 text-amber-700",
        danger: "border-rose-500/30 bg-rose-500/15 text-rose-700",
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
