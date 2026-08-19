# OTP long-press repro (Android)

Standalone Vite + React app reproducing a bug in the `InputSegmented` OTP
component from `@medidata/mdc-ui-components`: **long-pressing a slot on Android
does not open the text / _Paste_ popup**, so a copied verification code can't be
pasted via long-press.

The `src/components/InputSegmented/` files are copied verbatim from the library
(the i18n live-region hook is swapped for a small local string shim so the repro
has no i18next dependency). No component behaviour was changed.

## Why it happens

In `InputSegmentedSlot` / `InputSegmentedHiddenInput`:

- the real `<input>` is `opacity-0` **and** `pointer-events-none`
- the visible slots are `select-none` and call `onMouseDown` → `event.preventDefault()`

On Android the long-press gesture that summons the selection / Paste menu is
suppressed by exactly this combination, so there is no way to paste by
long-press.

## SMS auto-fill

No single mechanism gives silent SMS autofill on every platform — this is a
platform limit, not a code one. The fixed field uses the standard combo:

- **`autocomplete="one-time-code"`** (on by default) — iOS/Safari and Android
  surface the code as a keyboard suggestion the user taps.
- **`enableSmsAutofill`** — opts into the **WebOTP API** (Chromium/Android): an
  origin-bound SMS auto-fills with one consent tap. No-op on iOS/desktop/Firefox.

WebOTP requires HTTPS (Pages ✓) and the SMS to end with the origin binding, e.g.:

```
Your code is 123456

@dix.consulting #123456
```

## Run locally

```bash
nvm use            # Node 22
npm install
npm run dev        # http://localhost:5173
```

### Test on a real Android device (same network)

```bash
npm run dev:host   # or: npm run build && npm run preview:host
```

Open the printed `http://<your-ip>:<port>` URL on the phone (phone and computer
on the same Wi-Fi / VPN).

## Deploy to GitHub Pages

1. Create a GitHub repo and push this folder to `main`.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes on every
   push to `main`. The live URL appears in the Actions run summary.

`vite.config.ts` uses `base: "./"` (relative asset URLs), so the build works
under any Pages project path without further configuration.

> Note: publishing to GitHub Pages makes the copied component source public.
