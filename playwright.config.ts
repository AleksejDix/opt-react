import { defineConfig, devices } from "@playwright/test"

// A dedicated port so the suite never fights the dev server you have open.
// vite.config.ts reads PORT (Vite has no built-in support for it).
const PORT = 5199

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry"
  },

  // The long-press paste bug was an engine painting rule, and the engine that
  // enforces it most strictly is WebKit — the one behind Safari on the iPhone
  // this was reported from. Chromium covers Android. Both run as touch devices;
  // a desktop mouse context would not exercise the gesture at all.
  projects: [
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } }
  ],

  webServer: {
    command: "npm run dev",
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore"
  }
})
