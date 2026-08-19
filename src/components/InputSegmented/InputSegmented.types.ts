import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { inputSegmentedSlotVariants } from "./InputSegmented.variants"

/** Imperative handle exposed via `ref` on `InputSegmented`. */
export type InputSegmentedHandle = {
  /** Move keyboard focus into the segmented input. */
  focus: () => void
  /** Clear all slots and place the cursor at the start. */
  clear: () => void
  /** Replace the current value; cursor lands on the first empty slot. */
  setValue: (value: string) => void
}

export type InputSegmentedProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "onBlur"> & {
  maxLength: number
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  disabled?: boolean
  pattern?: string | RegExp
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  /**
   * `autocomplete` on the underlying input. Defaults to `"one-time-code"` for
   * OTP / verification codes. Set to `"bday"` for date-of-birth, `"cc-number"`
   * for credit cards, or `"off"` to opt out of browser autofill.
   */
  autoComplete?: string
  containerClassName?: string
  className?: string
  autoFocus?: boolean
  /** Sanitize text from a paste before it's distributed across slots (e.g. strip dashes from "1-2-3"). */
  pasteTransformer?: (rawText: string) => string
  /** When true, slots render `•` instead of the typed character (verification-code style). */
  mask?: boolean
  /** Fires when a typed character is rejected by `pattern`. Use to flash a hint ("Only digits allowed"). */
  onInvalid?: (rejectedChar: string) => void
  children: React.ReactNode
}

export type InputSegmentedGroupProps = React.ComponentProps<"div">

export type InputSegmentedSlotProps = Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof inputSegmentedSlotVariants> & {
    index: number
    placeholder?: string
  }

export type InputSegmentedSeparatorProps = React.ComponentProps<"div">
