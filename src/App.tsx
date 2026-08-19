import { useEffect, useRef, useState } from "react"
import {
  InputSegmented,
  InputSegmentedGroup,
  InputSegmentedSlot,
  REGEXP_ONLY_DIGITS
} from "./components/InputSegmented/InputSegmented"
import { useWebOtpAutofill } from "./hooks/useWebOtpAutofill"

const TEST_CODE = "123456"

export function App() {
  const [otp, setOtp] = useState("")
  const [otpFixed, setOtpFixed] = useState("")
  const [nativeValue, setNativeValue] = useState("")
  const [log, setLog] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const logCounter = useRef(0)

  const addLog = (message: string) => {
    logCounter.current += 1
    const id = logCounter.current
    setLog((prev) => [`#${id}  ${message}`, ...prev].slice(0, 12))
  }

  // WebOTP lives in the consumer (single owner) and feeds the fixed field's
  // controlled value — the InputSegmented stays presentational.
  useWebOtpAutofill((code) => {
    setOtpFixed(code)
    addLog(`WebOTP → filled "${code}"`)
  })

  const copyTestCode = async () => {
    try {
      await navigator.clipboard.writeText(TEST_CODE)
      setCopied(true)
      addLog(`clipboard.writeText("${TEST_CODE}") OK`)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      addLog(`clipboard.writeText FAILED: ${(err as Error).message}`)
    }
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">OTP long-press repro (Android)</h1>
        <p className="text-sm text-muted-foreground">
          Reproduces: long-press on the segmented OTP field does not bring up the Android text/
          <em>Paste</em> menu, so a copied code cannot be pasted by long-press. Component:{" "}
          <code>InputSegmented</code> (the atom behind <code>FieldOTP</code>), copied verbatim from{" "}
          <code>@medidata/mdc-ui-components</code>.
        </p>
      </header>

      <section className="rounded-md border border-border p-4">
        <h2 className="mb-2 text-sm font-semibold">Steps</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Tap <strong>Copy test code</strong> below (puts <code>{TEST_CODE}</code> on the clipboard).
          </li>
          <li>
            On the <strong>bug</strong> field: <strong>long-press</strong> a slot (Android) or{" "}
            <strong>right-click</strong> it (desktop). No <em>Paste</em> menu appears — nothing happens.
          </li>
          <li>
            On the <strong>fixed</strong> field: same gesture now shows the <em>Paste</em> menu; tapping{" "}
            <em>Paste</em> fills the code.
          </li>
          <li>
            The plain input at the bottom is a control — the <em>Paste</em> menu always works there.
          </li>
        </ol>
        <button
          type="button"
          onClick={copyTestCode}
          className="mt-3 inline-flex h-9 items-center rounded-md border border-input bg-transparent px-4 text-sm font-medium active:bg-input/40"
        >
          {copied ? "Copied ✓" : "Copy test code"}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">OTP component (bug)</h2>
        <InputSegmented
          maxLength={6}
          value={otp}
          onChange={(next) => {
            setOtp(next)
            addLog(`OTP onChange → "${next}"`)
          }}
          onComplete={(next) => addLog(`OTP onComplete → "${next}"`)}
          pattern={REGEXP_ONLY_DIGITS}
          inputMode="numeric"
        >
          <InputSegmentedGroup>
            {Array.from({ length: 6 }).map((_, i) => (
              <InputSegmentedSlot key={i} index={i} size="xl" />
            ))}
          </InputSegmentedGroup>
        </InputSegmented>
        <p className="text-xs text-muted-foreground">
          Current value: <code>{otp || "(empty)"}</code>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          OTP component (fixed — <code>enableLongPressPaste</code>)
        </h2>
        <InputSegmented
          maxLength={6}
          value={otpFixed}
          onChange={(next) => {
            setOtpFixed(next)
            addLog(`FIXED onChange → "${next}"`)
          }}
          onComplete={(next) => addLog(`FIXED onComplete → "${next}"`)}
          pattern={REGEXP_ONLY_DIGITS}
          inputMode="numeric"
          enableLongPressPaste
        >
          <InputSegmentedGroup>
            {Array.from({ length: 6 }).map((_, i) => (
              <InputSegmentedSlot key={i} index={i} size="xl" />
            ))}
          </InputSegmentedGroup>
        </InputSegmented>
        <p className="text-xs text-muted-foreground">
          Current value: <code>{otpFixed || "(empty)"}</code> — long-press (Android) / right-click (desktop)
          offers <em>Paste</em>. SMS auto-fill is driven by the consumer via{" "}
          <code>useWebOtpAutofill</code> (WebOTP, Android Chrome) plus{" "}
          <code>autocomplete="one-time-code"</code> (iOS keyboard suggestion).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Plain input (control — long-press works here)</h2>
        <input
          type="text"
          inputMode="numeric"
          value={nativeValue}
          onChange={(e) => setNativeValue(e.currentTarget.value)}
          onPaste={(e) => addLog(`native onPaste → "${e.clipboardData.getData("text/plain")}"`)}
          placeholder="Long-press me to paste"
          className="h-11 rounded-md border border-input bg-transparent px-3 text-base outline-none focus:border-ring"
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Event log</h2>
        <pre className="min-h-24 whitespace-pre-wrap rounded-md border border-border bg-black/5 p-3 text-xs leading-relaxed">
          {log.length ? log.join("\n") : "(no events yet)"}
        </pre>
      </section>

      <DeviceInfo />
    </main>
  )
}

function DeviceInfo() {
  const [ua, setUa] = useState("")
  useEffect(() => setUa(navigator.userAgent), [])
  return (
    <footer className="text-[11px] text-muted-foreground">
      <span className="font-semibold">UA:</span> {ua}
    </footer>
  )
}
