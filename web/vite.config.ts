import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // MapLibre alone is ~1.1 MB; it's lazy-loaded only when there's no Google key.
    chunkSizeWarningLimit: 1200,
  },
  optimizeDeps: {
    // Keep a single MapLibre instance so setWorkerUrl() reaches the copy react-map-gl uses.
    exclude: ['maplibre-gl'],
  },
})
