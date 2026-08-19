import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// base: "./" keeps asset URLs relative so the same build works both locally
// (vite preview) and under a GitHub Pages project path (/<repo>/).
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()]
})
