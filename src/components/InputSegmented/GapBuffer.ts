/**
 * GapBuffer
 * =========
 *
 * Fixed-capacity, immutable buffer of N slots (a slot is `string` or `undefined`),
 * plus a cursor pointing at the slot currently in focus. Every mutation returns
 * a new `GapBuffer` — React treats it as a value, not a mutable structure.
 *
 * "Gap buffer" in the classic text-editor sense models the cursor as a gap in
 * an array; here, the cursor is the slot the user is currently editing and the
 * "gap" is the (possibly empty) slot at that position. Inserting fills the
 * cursor slot and advances; Backspace shrinks back, mirroring a real editor.
 *
 * No React, no DOM — pure data. Suitable for unit testing in isolation.
 */

export const GAP = " "

export const REGEXP_ONLY_DIGITS = "^\\d+$"

export type Slot = string | undefined

type GapBufferInternals = {
  readonly slots: readonly Slot[]
  readonly cursor: number
  readonly maxLength: number
  readonly pattern?: RegExp
}

export type GapBufferOptions = {
  maxLength: number
  value?: string
  cursor?: number
  pattern?: string | RegExp
}

export class GapBuffer {
  readonly slots: readonly Slot[]
  readonly cursor: number
  readonly maxLength: number
  readonly pattern?: RegExp

  constructor(options: GapBufferOptions | GapBufferInternals) {
    if ("slots" in options) {
      this.slots = options.slots
      this.cursor = options.cursor
      this.maxLength = options.maxLength
      this.pattern = options.pattern
      return
    }
    const { maxLength, value = "", cursor = 0, pattern } = options
    this.maxLength = maxLength
    this.slots = parseValue(value, maxLength)
    this.cursor = clamp(cursor, 0, maxLength - 1)
    this.pattern = pattern ? normalizePattern(pattern) : undefined
  }

  /** True iff `char` is permitted by the pattern (or there is no pattern). */
  accepts(char: string): boolean {
    return !this.pattern || this.pattern.test(char)
  }

  /**
   * Write `char` at `index`. Advances the cursor by one (clamped to maxLength-1)
   * unless `char` is empty (in which case the slot is cleared and the cursor stays).
   * Returns `this` (same identity) when no change occurs — useful for React equality checks.
   */
  insertAt(index: number, char: string): GapBuffer {
    if (index < 0 || index >= this.maxLength) return this
    if (char && !this.accepts(char)) return this
    const slot = char || undefined
    if (this.slots[index] === slot && (!char || this.cursor === Math.min(index + 1, this.maxLength - 1))) {
      return this
    }
    const slots = this.slots.slice()
    slots[index] = slot
    const cursor = char ? Math.min(index + 1, this.maxLength - 1) : index
    return new GapBuffer({ slots, cursor, maxLength: this.maxLength, pattern: this.pattern })
  }

  /**
   * Backspace at `index`:
   *  - filled slot → clear it, cursor stays
   *  - empty slot → clear the previous slot, cursor retreats
   *  - empty slot at index 0 → no-op
   */
  backspaceAt(index: number): GapBuffer {
    if (index < 0 || index >= this.maxLength) return this
    if (this.slots[index]) {
      const slots = this.slots.slice()
      slots[index] = undefined
      return new GapBuffer({ slots, cursor: index, maxLength: this.maxLength, pattern: this.pattern })
    }
    if (index === 0) return this
    const slots = this.slots.slice()
    slots[index - 1] = undefined
    return new GapBuffer({ slots, cursor: index - 1, maxLength: this.maxLength, pattern: this.pattern })
  }

  /**
   * Distribute `text` across slots starting at `index`, skipping chars that fail
   * the pattern. Cursor advances to the slot after the last char written (clamped).
   */
  pasteAt(index: number, text: string): GapBuffer {
    if (index < 0 || index >= this.maxLength) return this
    const slots = this.slots.slice()
    let cursor = index
    let changed = false
    for (const ch of text) {
      if (cursor >= this.maxLength) break
      if (!this.accepts(ch)) continue
      slots[cursor] = ch
      cursor++
      changed = true
    }
    if (!changed) return this
    return new GapBuffer({
      slots,
      cursor: Math.min(cursor, this.maxLength - 1),
      maxLength: this.maxLength,
      pattern: this.pattern
    })
  }

  /** Move the cursor to a specific slot (clamped). */
  focus(index: number): GapBuffer {
    const cursor = clamp(index, 0, this.maxLength - 1)
    if (cursor === this.cursor) return this
    return new GapBuffer({ slots: this.slots, cursor, maxLength: this.maxLength, pattern: this.pattern })
  }

  /**
   * Replace the buffer's contents from a serialized string. Cursor lands on the
   * first empty slot (or the last slot when the value fills everything).
   */
  setValue(value: string): GapBuffer {
    const slots = parseValue(value, this.maxLength)
    if (slotsEqual(slots, this.slots)) return this
    const firstEmpty = slots.indexOf(undefined)
    const cursor = firstEmpty === -1 ? this.maxLength - 1 : firstEmpty
    return new GapBuffer({ slots, cursor, maxLength: this.maxLength, pattern: this.pattern })
  }

  /** Serialize: gaps render as space, trailing gaps are stripped. */
  toString(): string {
    let str = ""
    for (const c of this.slots) str += c ?? GAP
    return str.replace(/ +$/, "")
  }

  /** True iff every slot is filled. */
  get isComplete(): boolean {
    return this.slots.length === this.maxLength && this.slots.every((s) => s !== undefined)
  }
}

export function slotsEqual(a: readonly Slot[], b: readonly Slot[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function parseValue(value: string, maxLength: number): Slot[] {
  const slots: Slot[] = []
  for (let i = 0; i < maxLength; i++) {
    const ch = value[i]
    slots.push(ch === undefined || ch === GAP ? undefined : ch)
  }
  return slots
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function normalizePattern(pattern: string | RegExp): RegExp {
  if (typeof pattern === "string") return new RegExp(pattern)
  if (!/[gy]/.test(pattern.flags)) return pattern
  return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ""))
}
