import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        destructive: "bg-status-error/10 text-status-error hover:bg-status-error/20",
        outline: "border border-gray-300 text-gray-800",
        success: "bg-status-success/10 text-status-success hover:bg-status-success/20",
        warning: "bg-status-warning/10 text-status-warning hover:bg-status-warning/20",
        info: "bg-status-info/10 text-status-info hover:bg-status-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
