import { cn } from "../../lib/utils"
import { useInputSegmentedContext } from "./InputSegmented.context"
import { InputSegmentedBlinkingCaret } from "./InputSegmentedBlinkingCaret"
import { inputSegmentedSlotVariants } from "./InputSegmented.variants"
import type { InputSegmentedSlotProps } from "./InputSegmented.types"

export function InputSegmentedSlot({
  index,
  size,
  placeholder,
  className,
  onMouseDown,
  ...props
}: InputSegmentedSlotProps) {
  const ctx = useInputSegmentedContext()
  const char = ctx.slots[index]
  const display = char ? (ctx.mask ? "•" : char) : null
  const isActive = ctx.cursor === index
  const hasFakeCaret = isActive && !char

  // Slots are presentational: the input on top owns pointer/touch (so the OS
  // long-press "Paste" menu can reach it). Click-to-focus is resolved by the
  // input's pointer hit-test (see InputSegmentedRoot), not per-slot handlers.
  return (
    <div
      data-slot="input-segmented-slot"
      data-index={index}
      data-active={isActive || undefined}
      onMouseDown={onMouseDown}
      className={cn(inputSegmentedSlotVariants({ size }), ctx.disabled && "pointer-events-none", className)}
      aria-hidden="true"
      {...props}
    >
      {display ?? (placeholder ? <span className="text-muted-foreground">{placeholder}</span> : null)}
      {hasFakeCaret && <InputSegmentedBlinkingCaret />}
    </div>
  )
}
