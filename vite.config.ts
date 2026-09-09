import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { createRequire } from 'node:module'

const { version } = createRequire(import.meta.url)('./package.json') as { version: string }

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  // Single source of truth for the version shown in Warren Settings.
  define: { __APP_VERSION__: JSON.stringify(version) },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) return 'three';
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
})
