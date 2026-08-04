import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { classifyVendorModule } from './config/vendor-chunk-policy.mjs'

export default defineConfig({
  plugins: [react()],
  base: '/vibra-heal/',
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: classifyVendorModule,
      },
    },
  },
})
