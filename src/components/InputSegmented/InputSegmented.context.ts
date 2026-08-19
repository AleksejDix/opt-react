import * as React from "react"
import type { Slot } from "./GapBuffer"

export { GAP, REGEXP_ONLY_DIGITS } from "./GapBuffer"

export type InputSegmentedContextValue = {
  slots: readonly Slot[]
  cursor: number
  focusSlot: (index: number) => void
  maxLength: number
  disabled?: boolean
  mask?: boolean
  /**
   * When true, the real <input> is the pointer/touch target (layered on top,
   * pointer-events enabled) so the OS long-press / right-click "Paste" menu can
   * reach it. Slots become purely presentational. See `enableLongPressPaste`.
   */
  interactive?: boolean
}

export const InputSegmentedContext = React.createContext<InputSegmentedContextValue | null>(null)

export function useInputSegmentedContext(): InputSegmentedContextValue {
  const ctx = React.useContext(InputSegmentedContext)
  if (!ctx) throw new Error("InputSegmentedSlot must be used within InputSegmented")
  return ctx
}
