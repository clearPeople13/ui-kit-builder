import { defineConfig } from 'vite'
import { apiPlugin } from './scripts/dev-api.mjs'
import { devPort } from './scripts/worktree-ports.mjs'

export default defineConfig({
  server: {
    port: devPort,
    watch: {
      ignored: ['**/.build/**', '**/dist/**']
    }
  },
  plugins: [apiPlugin()]
})
