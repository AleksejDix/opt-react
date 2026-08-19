import * as React from "react"
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

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    // When interactive, the input sits on top and owns pointer events; slots must
    // not preventDefault or they'd suppress the OS selection / Paste gesture.
    if (ctx.interactive) {
      onMouseDown?.(event)
      return
    }
    // Prevent the click from blurring the hidden input before we re-focus it.
    event.preventDefault()
    ctx.focusSlot(index)
    onMouseDown?.(event)
  }

  return (
    <div
      data-slot="input-segmented-slot"
      data-index={index}
      data-active={isActive || undefined}
      onMouseDown={handleMouseDown}
      className={cn(
        inputSegmentedSlotVariants({ size }),
        // Keep `select-none` only in the (buggy) non-interactive mode. When
        // interactive we must allow selection so the long-press gesture survives.
        !ctx.interactive && "select-none",
        ctx.disabled && "pointer-events-none",
        className
      )}
      aria-hidden="true"
      {...props}
    >
      {display ?? (placeholder ? <span className="text-muted-foreground">{placeholder}</span> : null)}
      {hasFakeCaret && <InputSegmentedBlinkingCaret />}
    </div>
  )
}
