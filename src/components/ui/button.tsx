import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-primary text-white hover:bg-brand-primary/90",
        destructive: "bg-status-error text-white hover:bg-status-error/90",
        outline: "border border-gray-300 bg-transparent text-gray-800 hover:bg-gray-50",
        secondary: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-brand-primary underline-offset-4 hover:underline",
        success: "bg-status-success text-white hover:bg-status-success/90",
      },
      size: {
        default: "h-11 px-5 py-3",    /* 44px height */
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",    /* 48px height */
        xl: "h-14 px-10 text-base font-semibold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
