import { cn } from "../../lib/utils"
import type { InputSegmentedGroupProps } from "./InputSegmented.types"

export function InputSegmentedGroup({ className, ...props }: InputSegmentedGroupProps) {
  return <div data-slot="input-segmented-group" className={cn("flex items-center", className)} {...props} />
}
