import { useEffect, useRef } from "react"

/**
 * Web OTP API autofill: when the SMS arrives in a format the browser recognises
 * (`@<host> #<code>` footer), Chrome on Android can hand the code back so we can
 * fill + submit without the user typing. Aborted on unmount. Silently no-ops on
 * unsupported browsers (iOS, desktop, Firefox).
 *
 * This lives OUTSIDE the input component on purpose: WebOTP allows only one
 * pending `credentials.get` per page, so a single owner (the form/consumer) must
 * make the call and feed the code into the field's controlled `value` — mirrors
 * patientdelivery's AuthSms/useWebOtpAutofill.
 *
 * `onCode` is held in a ref so the effect doesn't re-subscribe on every render
 * and the listener always sees the freshest closure.
 */
export function useWebOtpAutofill(onCode: (code: string) => void): void {
  const onCodeRef = useRef(onCode)
  useEffect(() => {
    onCodeRef.current = onCode
  })

  useEffect(() => {
    if (typeof window === "undefined" || !("OTPCredential" in window)) {
      return
    }

    const ac = new AbortController()
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal })
      .then((credential) => {
        const code = (credential as OTPCredential | null)?.code
        if (code) onCodeRef.current(code)
      })
      .catch(() => {
        // User dismissed, timeout, or browser denied — silent fall back to
        // manual entry.
      })

    return () => ac.abort()
  }, [])
}
