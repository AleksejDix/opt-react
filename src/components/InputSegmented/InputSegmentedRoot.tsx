import * as React from "react"
import { cn } from "../../lib/utils"
import { InputSegmentedContext, type InputSegmentedContextValue } from "./InputSegmented.context"
import { InputSegmentedHiddenInput } from "./InputSegmentedHiddenInput"
import { InputSegmentedLiveRegion } from "./InputSegmentedLiveRegion"
import { useInputSegmentedBuffer } from "./useInputSegmentedBuffer"
import { keyToAction } from "./InputSegmented.keymap"
import type { InputSegmentedHandle, InputSegmentedProps } from "./InputSegmented.types"
import type { SegmentedAction } from "./InputSegmented.reducer"

export type { SegmentedAction }

export const InputSegmented = React.forwardRef<InputSegmentedHandle, InputSegmentedProps>(function InputSegmented(
  {
    maxLength,
    value,
    defaultValue,
    onChange,
    onComplete,
    onInvalid,
    onBlur,
    disabled,
    pattern,
    inputMode,
    containerClassName,
    className,
    autoFocus,
    pasteTransformer,
    mask,
    autoComplete = "one-time-code",
    enableLongPressPaste,
    enableSmsAutofill,
    children,
    ...props
  },
  forwardedRef
) {
  const { buffer, dispatch } = useInputSegmentedBuffer({
    maxLength,
    value,
    defaultValue,
    onChange,
    onComplete,
    onInvalid,
    pattern
  })

  const inputRef = React.useRef<HTMLInputElement>(null)
  // Tracks whether the user has interacted with this component. We can't snapshot
  // `document.activeElement === inputRef.current` once disabled flips because the
  // DOM has already blurred the input by the time our layout effect runs. Instead
  // we trust that any prior keystroke / focus action came from this user, and
  // restore focus when the parent re-enables (e.g. SmsVerification's
  // "verifying" → "error" transition).
  const hasUserInteractedRef = React.useRef(false)
  const wasDisabledRef = React.useRef(disabled)
  React.useLayoutEffect(() => {
    if (!disabled && wasDisabledRef.current && hasUserInteractedRef.current) {
      inputRef.current?.focus()
    }
    wasDisabledRef.current = disabled
  }, [disabled])

  React.useImperativeHandle(
    forwardedRef,
    () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => dispatch({ type: "replaceValue", value: "" }),
      setValue: (next: string) => dispatch({ type: "replaceValue", value: next })
    }),
    [dispatch]
  )

  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // WebOTP (Chromium/Android): auto-read an origin-bound SMS and fill the code.
  // Aborts on unmount and swallows the abort/no-SMS rejection. No-op elsewhere.
  React.useEffect(() => {
    if (!enableSmsAutofill) return
    if (typeof window === "undefined" || !("OTPCredential" in window)) return
    const ac = new AbortController()
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal })
      .then((credential) => {
        const code = (credential as OTPCredential | null)?.code
        if (code) dispatch({ type: "replaceValue", value: code })
      })
      .catch(() => {
        /* aborted, unsupported, or no SMS arrived — nothing to do */
      })
    return () => ac.abort()
  }, [enableSmsAutofill, dispatch])

  const focusSlot = React.useCallback(
    (index: number) => {
      hasUserInteractedRef.current = true
      inputRef.current?.focus()
      dispatch({ type: "moveCursor", toIndex: index })
    },
    [dispatch]
  )

  const ctxValue = React.useMemo<InputSegmentedContextValue>(
    () => ({
      slots: buffer.slots,
      cursor: buffer.cursor,
      focusSlot,
      maxLength,
      disabled,
      mask,
      interactive: enableLongPressPaste
    }),
    [buffer.slots, buffer.cursor, focusSlot, maxLength, disabled, mask, enableLongPressPaste]
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    hasUserInteractedRef.current = true
    const action = keyToAction(event, { cursor: buffer.cursor, maxLength })
    if (action) {
      event.preventDefault()
      dispatch(action)
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const raw = event.clipboardData.getData("text/plain")
    const text = pasteTransformer ? pasteTransformer(raw) : raw
    dispatch({ type: "pasteText", text })
  }

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      onBlur?.(event)
    }
  }

  const filledCount = buffer.slots.reduce<number>((n, s) => (s === undefined ? n : n + 1), 0)

  return (
    <InputSegmentedContext.Provider value={ctxValue}>
      <div
        role="group"
        data-slot="input-segmented"
        className={cn(
          "relative flex items-center gap-2 has-[input:disabled]:opacity-50",
          containerClassName,
          className
        )}
        onBlur={handleBlur}
        {...props}
      >
        {children}
        <InputSegmentedHiddenInput
          inputRef={inputRef}
          value={buffer.toString()}
          maxLength={maxLength}
          disabled={disabled}
          interactive={enableLongPressPaste}
          inputMode={inputMode}
          autoComplete={autoComplete}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onAutofill={(autofilled) => dispatch({ type: "replaceValue", value: autofilled })}
        />
        <InputSegmentedLiveRegion filledCount={filledCount} maxLength={maxLength} isComplete={buffer.isComplete} />
      </div>
    </InputSegmentedContext.Provider>
  )
})
