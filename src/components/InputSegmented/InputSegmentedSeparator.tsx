import { cn } from "../../lib/utils"
import type { InputSegmentedSeparatorProps } from "./InputSegmented.types"

export function InputSegmentedSeparator({ className, children, ...props }: InputSegmentedSeparatorProps) {
  return (
    <div
      data-slot="input-segmented-separator"
      role="separator"
      className={cn("flex items-center text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  )
}
