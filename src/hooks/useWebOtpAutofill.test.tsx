import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, renderHook } from "@testing-library/react"
import { useWebOtpAutofill } from "./useWebOtpAutofill"
import {
  InputSegmented,
  InputSegmentedGroup,
  InputSegmentedSlot,
  REGEXP_ONLY_DIGITS
} from "../components/InputSegmented/InputSegmented"
import "../index.css"

/**
 * A real SMS + Android Chrome are needed to exercise WebOTP end to end, which no
 * headless runner can provide. What we verify is the integration contract: when
 * the platform supports WebOTP, the hook requests an SMS OTP and hands the code
 * to `onCode`, and a consumer wiring that into a controlled field fills it. We
 * fake capability + navigator.credentials.get.
 */

const hadOtpCredential = "OTPCredential" in window

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  if (!hadOtpCredential) delete (window as unknown as Record<string, unknown>).OTPCredential
})

function enableWebOtpSupport() {
  // Presence of window.OTPCredential is how the hook feature-detects WebOTP.
  ;(window as unknown as Record<string, unknown>).OTPCredential = class {}
}

describe("useWebOtpAutofill", () => {
  it("requests an SMS OTP when supported", () => {
    enableWebOtpSupport()
    const get = vi.spyOn(navigator.credentials, "get").mockReturnValue(new Promise(() => {}))

    renderHook(() => useWebOtpAutofill(vi.fn()))

    expect(get).toHaveBeenCalledTimes(1)
    expect(get.mock.calls[0][0]).toMatchObject({ otp: { transport: ["sms"] } })
  })

  it("hands the received code to onCode", async () => {
    enableWebOtpSupport()
    vi.spyOn(navigator.credentials, "get").mockResolvedValue({ code: "123456" } as unknown as Credential)
    const onCode = vi.fn()

    renderHook(() => useWebOtpAutofill(onCode))

    await expect.poll(() => onCode.mock.calls).toContainEqual(["123456"])
  })

  it("does not call WebOTP when unsupported", () => {
    delete (window as unknown as Record<string, unknown>).OTPCredential
    const get = vi.spyOn(navigator.credentials, "get").mockReturnValue(new Promise(() => {}))

    renderHook(() => useWebOtpAutofill(vi.fn()))

    expect(get).not.toHaveBeenCalled()
  })

  it("fills a controlled InputSegmented when the code arrives", async () => {
    enableWebOtpSupport()
    vi.spyOn(navigator.credentials, "get").mockResolvedValue({ code: "123456" } as unknown as Credential)

    function Harness() {
      const [code, setCode] = useState("")
      useWebOtpAutofill(setCode)
      return (
        <InputSegmented maxLength={6} value={code} onChange={setCode} pattern={REGEXP_ONLY_DIGITS}>
          <InputSegmentedGroup>
            {Array.from({ length: 6 }).map((_, i) => (
              <InputSegmentedSlot key={i} index={i} />
            ))}
          </InputSegmentedGroup>
        </InputSegmented>
      )
    }

    const { container } = render(<Harness />)
    const input = container.querySelector<HTMLInputElement>('[data-slot="input-segmented-input"]')!

    await expect.poll(() => input.value).toBe("123456")
  })
})
