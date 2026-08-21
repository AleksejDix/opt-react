import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// base: "./" keeps asset URLs relative so the same build works both locally
// (vite preview) and under a GitHub Pages project path (/<repo>/).
// Vite has no built-in PORT support, so honour it explicitly: harnesses that
// assign a free port (rather than fighting over 5173) hand it over that way.
// strictPort when assigned — drifting to the next free port would leave the
// caller watching an address nothing is listening on.
const assignedPort = Number(process.env.PORT) || undefined

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { port: assignedPort, strictPort: assignedPort !== undefined }
})
