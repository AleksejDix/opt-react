import * as React from "react"

/**
 * The single underlying <input> that captures all keyboard, paste, and autofill
 * activity. Visually invisible (opacity:0) and not a pointer target — clicks
 * land on the slot divs above. Still focusable, still tabbable, still announced
 * by screen readers.
 */
type Props = {
  inputRef: React.Ref<HTMLInputElement>
  value: string
  maxLength: number
  disabled?: boolean
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
      className="absolute inset-0 size-full opacity-0 pointer-events-none"
    />
  )
}
