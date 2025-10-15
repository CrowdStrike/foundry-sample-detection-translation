import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
      },
    },
    minify: true,
    sourcemap: true,
  },
});
