import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * The single underlying <input> that captures all keyboard, paste, and autofill
 * activity. Visually invisible (opacity:0). Still focusable, still tabbable,
 * still announced by screen readers.
 *
 * By default it is NOT a pointer target (`pointer-events-none`) — clicks land on
 * the slot divs above. When `interactive` is set, it is layered on top and
 * receives pointer/touch events, so the OS long-press (Android) and right-click
 * (desktop) "Paste" menu can target it — the fix for the segmented-OTP paste bug.
 */
type Props = {
  inputRef: React.Ref<HTMLInputElement>
  value: string
  maxLength: number
  disabled?: boolean
  interactive?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  autoComplete: string
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>
  onPaste: React.ClipboardEventHandler<HTMLInputElement>
  /** Fires only for non-keystroke value changes (browser autofill, password managers). */
  onAutofill: (value: string) => void
}

export function InputSegmentedHiddenInput({
  inputRef,
  value,
  maxLength,
  disabled,
  interactive,
  inputMode,
  autoComplete,
  onKeyDown,
  onPaste,
  onAutofill
}: Props) {
  return (
    <input
      ref={inputRef}
      data-slot="input-segmented-input"
      type="text"
      inputMode={inputMode ?? "text"}
      autoComplete={autoComplete}
      maxLength={maxLength}
      disabled={disabled}
      value={value}
      onChange={(event) => onAutofill(event.currentTarget.value)}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      className={cn(
        "absolute inset-0 size-full opacity-0",
        // Interactive: sit above the slots (z-20 > active slot's z-10) and accept
        // pointer/touch so the native Paste menu reaches this input.
        interactive ? "z-20 cursor-text" : "pointer-events-none"
      )}
    />
  )
}
