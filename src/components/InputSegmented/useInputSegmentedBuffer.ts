import * as React from "react"
import { useControllableState } from "../../hooks/useControllableState"
import { GapBuffer } from "./GapBuffer"
import { reduce, type SegmentedAction } from "./InputSegmented.reducer"

/**
 * Owns the GapBuffer state for an InputSegmented:
 *  - bridges controlled / uncontrolled `value` via `useControllableState`
 *  - keeps `cursor` in a separate state slot (UI concern, not a value concern)
 *  - exposes `dispatch` that mutates a ref synchronously so rapid sync keystrokes
 *    in a single React tick all see each other's effects (avoids stale-closure bugs)
 *  - resets cursor to the first empty slot when the value prop changes from outside
 *    (e.g. parent setValue("") after a failed verification)
 */
export function useInputSegmentedBuffer(options: {
  maxLength: number
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  onInvalid?: (rejectedChar: string) => void
  pattern?: string | RegExp
}) {
  const { maxLength, value, defaultValue, onChange, onComplete, onInvalid, pattern } = options

  const [stringValue, setStringValue] = useControllableState<string>(value, defaultValue ?? "", onChange)
  const [cursor, setCursor] = React.useState(0)
  const lastEmittedValueRef = React.useRef<string>(stringValue)

  const buffer = React.useMemo(
    () => new GapBuffer({ maxLength, value: stringValue, cursor, pattern }),
    [maxLength, stringValue, cursor, pattern]
  )

  // Mirror of the latest buffer for synchronous access during rapid dispatches.
  const liveBufferRef = React.useRef(buffer)
  liveBufferRef.current = buffer

  // External value updates (parent setValue, RHF reset, autofill) park the cursor
  // on the first empty slot. The lastEmittedValueRef gate suppresses this when the
  // value change originated from our own dispatch.
  React.useLayoutEffect(() => {
    if (value === undefined) return
    if (value === lastEmittedValueRef.current) return
    lastEmittedValueRef.current = value
    const parsed = new GapBuffer({ maxLength, value })
    const firstEmpty = parsed.slots.indexOf(undefined)
    setCursor(firstEmpty === -1 ? maxLength - 1 : firstEmpty)
  }, [value, maxLength])

  const dispatch = React.useCallback(
    (action: SegmentedAction) => {
      const current = liveBufferRef.current
      const { buffer: next, rejected } = reduce(current, action)
      if (rejected !== undefined) onInvalid?.(rejected)
      if (next === current) return
      liveBufferRef.current = next
      const nextString = next.toString()
      if (nextString !== current.toString()) {
        lastEmittedValueRef.current = nextString
        setStringValue(nextString)
        if (next.isComplete) onComplete?.(nextString)
      }
      if (next.cursor !== current.cursor) {
        setCursor(next.cursor)
      }
    },
    [setStringValue, onComplete, onInvalid]
  )

  return { buffer, dispatch }
}
