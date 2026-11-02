import { defineConfig } from 'vite'
import { apiPlugin } from './scripts/dev-api.mjs'

export default defineConfig({
  server: {
    port: 5173,
    watch: {
      ignored: ['**/.build/**', '**/dist/**']
    }
  },
  plugins: [apiPlugin()]
})
