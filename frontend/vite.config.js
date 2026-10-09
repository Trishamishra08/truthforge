import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // three.js is split into a lazily loaded hero chunk on purpose.
  build: { chunkSizeWarningLimit: 1000 },
})
