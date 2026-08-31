import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#00a68f] text-white hover:bg-[#008d7a]",
        outline:
          "border border-[#00a68f] bg-white text-[#008d7a] hover:bg-[#e5f8f4]",
        ghost: "bg-transparent text-[#008d7a] hover:bg-[#e5f8f4]",
        danger:
          "border border-[#bd2c41] bg-white text-[#bd2c41] hover:bg-[#fff0f2]",
      },
      size: {
        default: "h-12 px-5",
        compact: "h-10 px-4",
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
