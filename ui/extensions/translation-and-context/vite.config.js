import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'app.js'
      }
    },
    minify: true,
    sourcemap: true,
  }
})