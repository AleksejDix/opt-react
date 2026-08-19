import { cva } from "class-variance-authority"

export const inputSegmentedSlotVariants = cva(
  [
    "relative flex items-center justify-center border-y border-e border-input bg-transparent text-sm shadow-xs transition-all outline-none",
    "first:rounded-s-md first:border-s last:rounded-e-md",
    "aria-invalid:border-destructive aria-invalid:bg-destructive/10 dark:aria-invalid:bg-destructive/20",
    "data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50",
    "data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 data-[active=true]:aria-invalid:ring-[3px] dark:data-[active=true]:aria-invalid:ring-destructive/40",
    "disabled:cursor-default disabled:border-border disabled:ring-0",
    "aria-invalid:disabled:border-destructive aria-invalid:disabled:ring-0",
    "dark:bg-input/30"
  ],
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-sm",
        md: "h-9 w-9 text-sm",
        lg: "h-11 w-11 text-base",
        xl: "h-14 w-14 text-2xl",
        "2xl": "h-20 w-20 text-4xl"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
)
