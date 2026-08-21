/**
 * Emulates the mobile long-press → "Paste" gesture.
 *
 * The callout menu itself is OS/browser chrome and cannot be driven by
 * Playwright, so this models the *preconditions* the engines apply before they
 * offer it. The one that matters here: WebKit and Blink only surface the
 * selection/paste callout for an editable element that is actually painted.
 * `opacity: 0` hit-tests fine and receives events, but no menu is offered —
 * which is exactly why a field can look interactive and still refuse to paste.
 */

const HOLD_MS = 550

type PasteMenu = {
  /** Emulates the user tapping "Paste" in the callout. */
  paste: (text: string) => void
}

export type LongPressResult = {
  /** The element the press hit-tested to. */
  target: Element | null
  /** The editable the OS would attach the callout to, if any. */
  editable: HTMLInputElement | HTMLTextAreaElement | null
  /** Null when the engine would not offer the callout; the reason is in `blockedBy`. */
  menu: PasteMenu | null
  blockedBy: string | null
}

function effectiveOpacity(el: Element): number {
  let opacity = 1
  for (let node: Element | null = el; node; node = node.parentElement) {
    opacity *= Number(getComputedStyle(node).opacity)
  }
  return opacity
}

function pasteMenuBlocker(el: Element | null): string | null {
  if (!el) return "press did not hit any element"

  const editable = el as HTMLInputElement
  const isTextField =
    (el.tagName === "INPUT" && /^(text|tel|number|password|search|url|email)$/.test(editable.type)) ||
    el.tagName === "TEXTAREA" ||
    (el as HTMLElement).isContentEditable
  if (!isTextField) return `press hit <${el.tagName.toLowerCase()}>, which is not an editable text field`
  if (editable.disabled) return "editable is disabled"
  if (editable.readOnly) return "editable is readonly"

  const style = getComputedStyle(el)
  if (style.visibility !== "visible") return `visibility is "${style.visibility}"`
  if (style.display === "none") return 'display is "none"'
  if (effectiveOpacity(el) === 0) return "effective opacity is 0 — the engine paints nothing, so it offers no callout"

  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return "editable has zero size"

  const userSelect = style.webkitUserSelect || style.userSelect
  if (userSelect === "none") return `user-select is "none"`
  if (style.getPropertyValue("-webkit-touch-callout") === "none") return '-webkit-touch-callout is "none"'

  return null
}

/** Presses and holds at a viewport point, then reports whether a Paste callout would appear. */
export async function longPressAt(x: number, y: number): Promise<LongPressResult> {
  const target = document.elementFromPoint(x, y)
  const common = { bubbles: true, cancelable: true, clientX: x, clientY: y }

  target?.dispatchEvent(new PointerEvent("pointerdown", { ...common, pointerType: "touch", isPrimary: true }))
  await new Promise((resolve) => setTimeout(resolve, HOLD_MS))

  // Android/desktop raise contextmenu at the end of the hold; suppressing it
  // suppresses the callout.
  const contextMenu = new MouseEvent("contextmenu", common)
  const delivered = target?.dispatchEvent(contextMenu)

  const blockedBy = pasteMenuBlocker(target) ?? (delivered === false ? "contextmenu was preventDefault()ed" : null)
  const editable =
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target : null

  return {
    target,
    editable,
    blockedBy,
    menu:
      blockedBy || !editable
        ? null
        : {
            paste: (text: string) => {
              const clipboardData = new DataTransfer()
              clipboardData.setData("text/plain", text)
              editable.dispatchEvent(new ClipboardEvent("paste", { ...common, clipboardData }))
              editable.dispatchEvent(new PointerEvent("pointerup", { ...common, pointerType: "touch" }))
            }
          }
  }
}

/** Presses and holds at the centre of an element. */
export function longPress(el: Element): Promise<LongPressResult> {
  const rect = el.getBoundingClientRect()
  return longPressAt(Math.round(rect.left + rect.width / 2), Math.round(rect.top + rect.height / 2))
}
