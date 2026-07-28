import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev server + build for the playground. Test config lives in vitest.config.ts —
// vitest ships its own vite, and sharing one file makes the two copies' plugin types
// collide under `tsc --noEmit`.
export default defineConfig({
  plugins: [react()],
  // `bun dev` serves the playground from the repo root (index.html lives there).
  server: { port: 5173, open: false },
  // Fixture videos are served as URLs, not inlined.
  assetsInclude: ["**/*.mp4"],
});
