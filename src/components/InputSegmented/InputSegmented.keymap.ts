import type { SegmentedAction } from "./InputSegmented.reducer"

/**
 * Maps a KeyboardEvent to a SegmentedAction (or null when the key is not
 * consumed by the segmented input). Pure: no DOM access, no preventDefault.
 * Callers preventDefault iff the result is non-null.
 *
 * Cursor-relative arrow keys read the live cursor so callers don't have to
 * capture it in a closure.
 */
export type KeymapContext = { cursor: number; maxLength: number }

export type KeyboardEventLike = Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">

export function keyToAction(event: KeyboardEventLike, ctx: KeymapContext): SegmentedAction | null {
  switch (event.key) {
    case "Backspace":
      return { type: "pressBackspace" }
    case "ArrowLeft":
      return { type: "moveCursor", toIndex: ctx.cursor - 1 }
    case "ArrowRight":
      return { type: "moveCursor", toIndex: ctx.cursor + 1 }
    case "Home":
      return { type: "moveCursor", toIndex: 0 }
    case "End":
      return { type: "moveCursor", toIndex: ctx.maxLength - 1 }
  }
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    return { type: "typeCharacter", char: event.key }
  }
  return null
}
