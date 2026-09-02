import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-5 text-sm font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--teal)] text-white hover:bg-[var(--teal-deep)]",
        outline:
          "border border-[var(--teal)] bg-white text-[var(--teal-deep)] hover:bg-[var(--teal-pale)]",
        ghost:
          "bg-transparent text-[var(--teal-deep)] hover:bg-[var(--teal-pale)]",
        danger:
          "border border-[var(--danger)] bg-white text-[var(--danger)] hover:bg-[#fff5f5]",
      },
      size: {
        default: "min-h-12",
        compact: "min-h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
