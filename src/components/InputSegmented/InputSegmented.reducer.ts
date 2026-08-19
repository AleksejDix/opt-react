import { GapBuffer } from "./GapBuffer"

/**
 * Cursor-relative actions: the reducer reads `buffer.cursor` itself, so callers
 * never need to capture the cursor in a closure (avoids stale-closure bugs when
 * multiple keystrokes batch in one React tick).
 */
export type SegmentedAction =
  | { type: "typeCharacter"; char: string }
  | { type: "pressBackspace" }
  | { type: "pasteText"; text: string }
  | { type: "moveCursor"; toIndex: number }
  | { type: "replaceValue"; value: string }

/** `rejected` is set when a `typeCharacter` was dropped by the pattern. */
export type ReduceResult = { buffer: GapBuffer; rejected?: string }

/** Pure reducer: `(buffer, action) → { buffer, rejected? }`. No React, no DOM, no side effects. */
export function reduce(buffer: GapBuffer, action: SegmentedAction): ReduceResult {
  switch (action.type) {
    case "typeCharacter":
      if (action.char && !buffer.accepts(action.char)) {
        return { buffer, rejected: action.char }
      }
      return { buffer: buffer.insertAt(buffer.cursor, action.char) }
    case "pressBackspace":
      return { buffer: buffer.backspaceAt(buffer.cursor) }
    case "pasteText":
      return { buffer: buffer.pasteAt(buffer.cursor, action.text) }
    case "moveCursor":
      return { buffer: buffer.focus(action.toIndex) }
    case "replaceValue":
      return { buffer: buffer.setValue(action.value) }
  }
}
