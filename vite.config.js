import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/bussikartta/',
  plugins: [react()],
  server: {
    host: true,
  },
  preview: {
    allowedHosts: true
  }
})