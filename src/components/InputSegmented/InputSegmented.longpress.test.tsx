import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "@testing-library/react"
import {
  InputSegmented,
  InputSegmentedGroup,
  InputSegmentedSlot,
  REGEXP_ONLY_DIGITS
} from "./InputSegmented"
import "../../index.css"

/**
 * The long-press (Android) / right-click (desktop) "Paste" menu is browser-chrome
 * / OS UI and cannot be automated by Playwright. What we CAN verify — and what
 * actually determines whether the OS offers "Paste" — is where the press
 * hit-tests. `document.elementFromPoint` uses the same hit-testing as a real
 * pointer and ignores `pointer-events: none`, so:
 *
 *   - bug   → a press over a slot lands on a non-editable <div> ⇒ no Paste
 *   - fixed → a press over a slot lands on the real <input>      ⇒ OS offers Paste
 */

function Otp({ enableLongPressPaste }: { enableLongPressPaste?: boolean }) {
  return (
    <InputSegmented
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      enableLongPressPaste={enableLongPressPaste}
    >
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

function pressTargetAtCenter(el: Element) {
  const rect = el.getBoundingClientRect()
  const x = Math.round(rect.left + rect.width / 2)
  const y = Math.round(rect.top + rect.height / 2)
  return document.elementFromPoint(x, y)
}

describe("segmented OTP — bug (default, no enableLongPressPaste)", () => {
  it("the input is not a pointer target", () => {
    const { container } = render(<Otp />)
    const { input } = query(container)
    expect(getComputedStyle(input).pointerEvents).toBe("none")
  })

  it("slots suppress selection (select-none)", () => {
    const { container } = render(<Otp />)
    const { slots } = query(container)
    expect(getComputedStyle(slots[0]).userSelect).toBe("none")
  })

  it("a press over a slot lands on the slot div, NOT the input", () => {
    const { container } = render(<Otp />)
    const { input, slots } = query(container)
    const hit = pressTargetAtCenter(slots[3])
    expect(hit).not.toBe(input)
    expect(hit?.closest('[data-slot="input-segmented-slot"]')).toBe(slots[3])
  })
})

describe("segmented OTP — fixed (enableLongPressPaste)", () => {
  it("the input is a pointer target", () => {
    const { container } = render(<Otp enableLongPressPaste />)
    const { input } = query(container)
    expect(getComputedStyle(input).pointerEvents).not.toBe("none")
  })

  it("slots allow selection", () => {
    const { container } = render(<Otp enableLongPressPaste />)
    const { slots } = query(container)
    expect(getComputedStyle(slots[0]).userSelect).not.toBe("none")
  })

  it("a press over any slot hit-tests to the input (so the OS offers Paste)", () => {
    const { container } = render(<Otp enableLongPressPaste />)
    const { input, slots } = query(container)
    for (const slot of slots) {
      expect(pressTargetAtCenter(slot)).toBe(input)
    }
  })

  it("pasting into the input fills the slots", async () => {
    const { container } = render(<Otp enableLongPressPaste />)
    const { input } = query(container)

    const data = new DataTransfer()
    data.setData("text/plain", "123456")
    input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }))

    await expect.poll(() => input.value).toBe("123456")
  })
})
