import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  preview: {
    allowedHosts: true
  },
  optimizeDeps: {
    exclude: ['maplibre-gl', '@maplibre/maplibre-gl-leaflet'],
  },
})