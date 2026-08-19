import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Browser mode (real Chromium via Playwright) is required: the fix is about
// pointer hit-testing (document.elementFromPoint) and computed pointer-events /
// user-select, none of which are meaningful under jsdom. Tailwind is loaded so
// those utility classes actually resolve to real computed styles.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    browser: {
      enabled: true,
      provider: "playwright",
      headless: true,
      instances: [{ browser: "chromium" }]
    }
  }
})
