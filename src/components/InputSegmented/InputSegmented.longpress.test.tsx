import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "@testing-library/react"
import { InputSegmented, InputSegmentedGroup, InputSegmentedSlot, REGEXP_ONLY_DIGITS } from "./InputSegmented"
import "../../index.css"

/**
 * The long-press (Android) / right-click (desktop) "Paste" menu is browser-chrome
 * / OS UI and cannot be automated by Playwright. What we CAN verify — and what
 * actually determines whether the OS offers "Paste" — is where the press
 * hit-tests. `document.elementFromPoint` uses the same hit-testing as a real
 * pointer, so a press over any slot must land on the real <input> for the OS to
 * offer "Paste". This is now the only mode: the input is always the pointer
 * target, and click-to-focus is preserved by hit-testing the pointer to a slot.
 */

function Otp() {
  return (
    <InputSegmented maxLength={6} pattern={REGEXP_ONLY_DIGITS} inputMode="numeric">
      <InputSegmentedGroup>
        {Array.from({ length: 6 }).map((_, i) => (
          <InputSegmentedSlot key={i} index={i} size="xl" />
        ))}
      </InputSegmentedGroup>
    </InputSegmented>
  )
}

afterEach(cleanup)

function query(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>('[data-slot="input-segmented-input"]')!
  const slots = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="input-segmented-slot"]'))
  return { input, slots }
}

function centerOf(el: Element) {
  const rect = el.getBoundingClientRect()
  return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
}

describe("segmented OTP — long-press paste (always on)", () => {
  it("the input is a pointer target", () => {
    const { container } = render(<Otp />)
    const { input } = query(container)
    expect(getComputedStyle(input).pointerEvents).not.toBe("none")
  })

  it("slots allow selection", () => {
    const { container } = render(<Otp />)
    const { slots } = query(container)
    expect(getComputedStyle(slots[0]).userSelect).not.toBe("none")
  })

  it("a press over any slot hit-tests to the input (so the OS offers Paste)", () => {
    const { container } = render(<Otp />)
    const { input, slots } = query(container)
    for (const slot of slots) {
      const { x, y } = centerOf(slot)
      expect(document.elementFromPoint(x, y)).toBe(input)
    }
  })

  it("pasting into the input fills the slots", async () => {
    const { container } = render(<Otp />)
    const { input } = query(container)

    const data = new DataTransfer()
    data.setData("text/plain", "123456")
    input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }))

    await expect.poll(() => input.value).toBe("123456")
  })

  it("pressing a slot parks the cursor on it (click-to-focus preserved)", async () => {
    const { container } = render(<Otp />)
    const { input, slots } = query(container)
    const { x, y } = centerOf(slots[3])
    input.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: x, clientY: y }))

    await expect.poll(() => slots[3].getAttribute("data-active")).toBe("true")
  })
})
