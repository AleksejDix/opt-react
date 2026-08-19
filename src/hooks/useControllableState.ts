import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from "react"

export function useControllableState<T>(
  controlledValue: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void
): [T, Dispatch<SetStateAction<T>>] {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internal

  // Ref tracks latest value so functional updaters always see current state,
  // even when multiple updates batch in the same tick.
  const valueRef = useRef(value)
  valueRef.current = value

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (next) => {
      const prevValue = valueRef.current
      const nextValue = typeof next === "function" ? (next as (prev: T) => T)(prevValue) : next
      valueRef.current = nextValue
      if (!isControlled) {
        setInternal(nextValue)
      }
      onChange?.(nextValue)
    },
    [isControlled, onChange]
  )

  return [value, setValue]
}
