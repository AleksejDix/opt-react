import { test, expect, type Locator, type Page } from "@playwright/test"

/**
 * Regression cover for: long-pressing the segmented OTP field on iOS/Android
 * offered no "Paste".
 *
 * The callout is OS chrome — no automation can open it or read it. So rather
 * than pretend to click a menu item, these tests pin the two halves the engine
 * actually controls:
 *
 *   1. the precondition — WebKit/Blink only offer the callout for an editable
 *      they actually paint. `opacity: 0` was the bug: it hit-tests and takes
 *      events, then gets no menu. Asserted in real WebKit, the engine behind
 *      the iPhone this was reported from.
 *   2. the payload — a paste from the real system clipboard, delivered by the
 *      engine, must land in every slot. This is the same code path the callout's
 *      "Paste" fires.
 */

const CODE = "123456"

const input = (page: Page) => page.locator('[data-slot="input-segmented-input"]')
const slots = (page: Page) => page.locator('[data-slot="input-segmented-slot"]')

/** What the engine checks before it will attach a selection/paste callout. */
async function paintedForCallout(el: Locator) {
  return el.evaluate((node: HTMLInputElement) => {
    let opacity = 1
    for (let n: Element | null = node; n; n = n.parentElement) {
      opacity *= Number(getComputedStyle(n).opacity)
    }
    const style = getComputedStyle(node)
    const rect = node.getBoundingClientRect()
    return {
      opacity,
      visibility: style.visibility,
      display: style.display,
      width: rect.width,
      height: rect.height,
      userSelect: style.webkitUserSelect || style.userSelect,
      touchCallout: style.getPropertyValue("-webkit-touch-callout"),
      pointerEvents: style.pointerEvents,
      editable: node.tagName === "INPUT" && !node.disabled && !node.readOnly
    }
  })
}

test.describe("segmented OTP — long-press paste", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await expect(slots(page)).toHaveCount(6)
  })

  test("the field is painted, so the engine will offer its paste callout", async ({ page }) => {
    const painted = await paintedForCallout(input(page))

    // The exact assertion that fails on the original `opacity-0` field.
    expect(painted.opacity).toBeGreaterThan(0)
    expect(painted.editable).toBe(true)
    expect(painted.visibility).toBe("visible")
    expect(painted.display).not.toBe("none")
    expect(painted.width).toBeGreaterThan(0)
    expect(painted.height).toBeGreaterThan(0)
    expect(painted.userSelect).not.toBe("none")
    expect(painted.touchCallout).not.toBe("none")
    expect(painted.pointerEvents).not.toBe("none")
  })

  test("being painted does not make the input's own text visible", async ({ page }) => {
    await input(page).fill(CODE)
    const style = await input(page).evaluate((node) => {
      const s = getComputedStyle(node)
      return {
        color: s.color,
        caretColor: s.caretColor,
        backgroundColor: s.backgroundColor,
        textFillColor: s.getPropertyValue("-webkit-text-fill-color"),
        borderTopWidth: s.borderTopWidth
      }
    })

    const TRANSPARENT = "rgba(0, 0, 0, 0)"
    expect(style.color).toBe(TRANSPARENT)
    expect(style.caretColor).toBe(TRANSPARENT)
    expect(style.backgroundColor).toBe(TRANSPARENT)
    expect(style.textFillColor).toBe(TRANSPARENT)
    expect(style.borderTopWidth).toBe("0px")

    // The slots remain the only place the code is rendered.
    await expect(slots(page)).toHaveText(["1", "2", "3", "4", "5", "6"])
  })

  test("a touch anywhere on the field reaches the editable input", async ({ page }) => {
    const boxes = await slots(page).evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect()
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        return (hit as HTMLElement | null)?.dataset?.slot ?? null
      })
    )

    expect(boxes).toEqual(Array(6).fill("input-segmented-input"))
  })

  test("a real paste from the system clipboard fills every slot", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "scripted clipboard access is Chromium-only in Playwright")
    await context.grantPermissions(["clipboard-read", "clipboard-write"])

    // Tap the page's own copy button — a genuine user gesture writing to the
    // real clipboard, then a real paste keystroke the engine delivers itself.
    await page.getByRole("button", { name: /copy test code/i }).tap()
    await expect(page.getByRole("button", { name: /copied/i })).toBeVisible()

    await input(page).tap()
    await page.keyboard.press("ControlOrMeta+V")

    await expect(input(page)).toHaveValue(CODE)
    await expect(slots(page)).toHaveText(["1", "2", "3", "4", "5", "6"])
  })

  test("a paste carrying the code spreads it across the slots", async ({ page }) => {
    // Cross-engine companion to the test above: a real ClipboardEvent with a
    // real DataTransfer, so WebKit also covers the handler the callout fires.
    await input(page).evaluate((node, code) => {
      const clipboardData = new DataTransfer()
      clipboardData.setData("text/plain", code)
      node.dispatchEvent(new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }))
    }, CODE)

    await expect(input(page)).toHaveValue(CODE)
    await expect(slots(page)).toHaveText(["1", "2", "3", "4", "5", "6"])
  })

  test("a full code pasted onto a middle slot still fills the field from the start", async ({ page }) => {
    // The real long-press gesture: the user holds whatever slot is under their
    // thumb, which parks the cursor there. A whole code must not be inserted at
    // that offset — that dropped the overflow and produced "   123".
    const box = (await slots(page).nth(3).boundingBox())!
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
    await expect(slots(page).nth(3)).toHaveAttribute("data-active", "true")

    await input(page).evaluate((node, code) => {
      const clipboardData = new DataTransfer()
      clipboardData.setData("text/plain", code)
      node.dispatchEvent(new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }))
    }, CODE)

    await expect(input(page)).toHaveValue(CODE)
    await expect(slots(page)).toHaveText(["1", "2", "3", "4", "5", "6"])
  })

  test("a partial paste still lands at the cursor", async ({ page }) => {
    const box = (await slots(page).nth(2).boundingBox())!
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)

    await input(page).evaluate((node) => {
      const clipboardData = new DataTransfer()
      clipboardData.setData("text/plain", "99")
      node.dispatchEvent(new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }))
    })

    await expect(slots(page)).toHaveText(["", "", "9", "9", "", ""])
  })

  test("tapping a slot parks the cursor on it", async ({ page }) => {
    // Tap by coordinate, not `locator.tap()`: the input deliberately covers the
    // slots, so Playwright's actionability check would (correctly) refuse. This
    // is the user's actual gesture — a touch that lands on the input on top.
    const box = (await slots(page).nth(3).boundingBox())!
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)

    await expect(slots(page).nth(3)).toHaveAttribute("data-active", "true")
  })

  test("holding a touch down keeps focus and never suppresses the callout", async ({ page, browserName }) => {
    // A genuine timed touch sequence through the engine's own input pipeline,
    // which drives its real long-press gesture recogniser. CDP is Chromium-only.
    test.skip(browserName !== "chromium", "raw timed touch injection requires CDP")

    const box = (await slots(page).nth(2).boundingBox())!
    const x = Math.round(box.x + box.width / 2)
    const y = Math.round(box.y + box.height / 2)

    const suppressed = page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          document.addEventListener("contextmenu", (e) => resolve(e.defaultPrevented), { once: true })
          setTimeout(() => resolve(false), 3000)
        })
    )

    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, radiusX: 12, radiusY: 12, force: 1 }]
    })
    await page.waitForTimeout(700)
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })

    expect(await suppressed).toBe(false)
    await expect(input(page)).toBeFocused()
  })
})
