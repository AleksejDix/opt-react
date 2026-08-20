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
  const containerRef = React.useRef<HTMLDivElement>(null)
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

  const ctxValue = React.useMemo<InputSegmentedContextValue>(
    () => ({
      slots: buffer.slots,
      cursor: buffer.cursor,
      maxLength,
      disabled,
      mask
    }),
    [buffer.slots, buffer.cursor, maxLength, disabled, mask]
  )

  // The input sits on top and owns pointer events (so the OS long-press "Paste"
  // menu can reach it). Preserve click-to-focus by hit-testing the pointer
  // against the presentational slots and parking the cursor on the one pressed.
  const handlePointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    hasUserInteractedRef.current = true
    inputRef.current?.focus()
    const slotEls = containerRef.current?.querySelectorAll<HTMLElement>('[data-slot="input-segmented-slot"]')
    if (!slotEls) return
    for (const el of slotEls) {
      const rect = el.getBoundingClientRect()
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        const index = Number(el.dataset.index)
        if (!Number.isNaN(index)) dispatch({ type: "moveCursor", toIndex: index })
        return
      }
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    hasUserInteractedRef.current = true
    const action = keyToAction(event, { cursor: buffer.cursor, maxLength })
    if (action) {
      event.preventDefault()
      dispatch(action)
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    hasUserInteractedRef.current = true
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
        ref={containerRef}
        {...props}
      >
        {children}
        <InputSegmentedHiddenInput
          inputRef={inputRef}
          value={buffer.toString()}
          maxLength={maxLength}
          disabled={disabled}
          inputMode={inputMode}
          autoComplete={autoComplete}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onPointerDown={handlePointerDown}
          onAutofill={(autofilled) => dispatch({ type: "replaceValue", value: autofilled })}
        />
        <InputSegmentedLiveRegion filledCount={filledCount} maxLength={maxLength} isComplete={buffer.isComplete} />
      </div>
    </InputSegmentedContext.Provider>
  )
})
