import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@toby/chrome-adapters": path.resolve(__dirname, "src/preview/mockChromeAdapters.ts"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../../docs/preview"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "preview/index.html"),
      },
    },
  },
});
