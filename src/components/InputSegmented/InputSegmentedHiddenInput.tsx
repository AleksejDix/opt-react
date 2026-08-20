import * as React from "react"

/**
 * The single underlying <input> that captures all keyboard, paste, and autofill
 * activity. Visually invisible (opacity:0). Still focusable, still tabbable,
 * still announced by screen readers.
 *
 * It is layered on top of the slots (`z-20`) and IS the pointer/touch target, so
 * the OS long-press (Android) and right-click (desktop) "Paste" menu can target
 * it. Click-to-focus a specific slot is preserved by hit-testing the pointer
 * against the slots in `onPointerDown` (see InputSegmentedRoot).
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
  onPointerDown: React.PointerEventHandler<HTMLInputElement>
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
  onPointerDown,
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
      onPointerDown={onPointerDown}
      // Sit above the slots (z-20 > active slot's z-10) and accept pointer/touch
      // so the native Paste menu reaches this input.
      className="absolute inset-0 size-full opacity-0 z-20 cursor-text"
    />
  )
}
