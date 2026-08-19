import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render } from "@testing-library/react"
import { InputSegmented, InputSegmentedGroup, InputSegmentedSlot, REGEXP_ONLY_DIGITS } from "./InputSegmented"
import "../../index.css"

/**
 * A real SMS + Android Chrome are needed to exercise WebOTP end to end, which no
 * headless runner can provide. What we can verify is the integration contract:
 * when the platform supports WebOTP, the component requests an SMS OTP and, on
 * resolution, fills the field. We fake capability + navigator.credentials.get.
 */

function Otp(props: { enableSmsAutofill?: boolean }) {
  return (
    <InputSegmented maxLength={6} pattern={REGEXP_ONLY_DIGITS} inputMode="numeric" {...props}>
      <InputSegmentedGroup>
        {Array.from({ length: 6 }).map((_, i) => (
          <InputSegmentedSlot key={i} index={i} size="xl" />
        ))}
      </InputSegmentedGroup>
    </InputSegmented>
  )
}

const hadOtpCredential = "OTPCredential" in window

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  if (!hadOtpCredential) delete (window as unknown as Record<string, unknown>).OTPCredential
})

function fakeWebOtpSupport() {
  // Presence of window.OTPCredential is how the component feature-detects WebOTP.
  ;(window as unknown as Record<string, unknown>).OTPCredential = class {}
}

describe("segmented OTP — SMS autofill (WebOTP)", () => {
  it("requests an SMS OTP when enabled and supported", () => {
    fakeWebOtpSupport()
    const get = vi.spyOn(navigator.credentials, "get").mockReturnValue(new Promise(() => {}))

    render(<Otp enableSmsAutofill />)

    expect(get).toHaveBeenCalledTimes(1)
    expect(get.mock.calls[0][0]).toMatchObject({ otp: { transport: ["sms"] } })
  })

  it("fills the field with the received code", async () => {
    fakeWebOtpSupport()
    vi.spyOn(navigator.credentials, "get").mockResolvedValue({ code: "123456" } as unknown as Credential)

    const { container } = render(<Otp enableSmsAutofill />)
    const input = container.querySelector<HTMLInputElement>('[data-slot="input-segmented-input"]')!

    await expect.poll(() => input.value).toBe("123456")
  })

  it("does not call WebOTP when the flag is off", () => {
    fakeWebOtpSupport()
    const get = vi.spyOn(navigator.credentials, "get").mockReturnValue(new Promise(() => {}))

    render(<Otp />)

    expect(get).not.toHaveBeenCalled()
  })
})
