import * as React from "react"
import type { Slot } from "./GapBuffer"

export { GAP, REGEXP_ONLY_DIGITS } from "./GapBuffer"

export type InputSegmentedContextValue = {
  slots: readonly Slot[]
  cursor: number
  maxLength: number
  disabled?: boolean
  mask?: boolean
}

export const InputSegmentedContext = React.createContext<InputSegmentedContextValue | null>(null)

export function useInputSegmentedContext(): InputSegmentedContextValue {
  const ctx = React.useContext(InputSegmentedContext)
  if (!ctx) throw new Error("InputSegmentedSlot must be used within InputSegmented")
  return ctx
}
