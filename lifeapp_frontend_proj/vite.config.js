/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js', // Optional: für globale Setup-Aufgaben
    css: true, // Optional: wenn CSS-Importe in Komponenten getestet werden sollen
  },
})
