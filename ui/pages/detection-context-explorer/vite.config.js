import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react({
      include: "**/*.{jsx,tsx,js,ts}",
    }),
  ],
  build: {
    outDir: "src/dist",
    rollupOptions: {
      input: "index.html",
    },
    sourcemap: false,
  },
  define:
    mode === "production"
      ? {
          "process.env.NODE_ENV": JSON.stringify("production"),
        }
      : {},
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    globals: true,
  },
}));
