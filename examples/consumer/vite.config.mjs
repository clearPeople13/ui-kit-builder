import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { apiPlugin } from '../../scripts/dev-api.mjs'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const repoDir = path.resolve(rootDir, '../..')
const configuratorDir = path.join(repoDir, 'configurator')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2'
}

function serveFile(response, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.statusCode = 404
      response.end('Not found')
      return
    }
    response.setHeader('Content-Type', MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream')
    response.end(content)
  })
}

function configuratorPlugin() {
  return {
    name: 'ui-kit-configurator',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = (request.url ?? '').split('?')[0]
        if (url === '/sizes.json') {
          serveFile(response, path.join(repoDir, 'sizes.json'))
          return
        }
        if (url !== '/configurator' && !url.startsWith('/configurator/')) {
          next()
          return
        }
        const relative = url === '/configurator' ? 'index.html' : url.slice('/configurator/'.length) || 'index.html'
        const filePath = path.resolve(configuratorDir, relative)
        if (!filePath.startsWith(configuratorDir + path.sep) && filePath !== path.join(configuratorDir, 'index.html')) {
          response.statusCode = 403
          response.end('Forbidden')
          return
        }
        // 构建器源码依赖裸模块（vue），必须交给 Vite 转译，静态直出会导致 import 解析失败
        if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
          const query = (request.url ?? '').split('?')[1]
          request.url = `/@fs/${filePath.replace(/\\/g, '/')}${query ? `?${query}` : ''}`
          next()
          return
        }
        serveFile(response, filePath)
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), configuratorPlugin(), apiPlugin()],
  resolve: {
    dedupe: ['vue']
  },
  server: {
    port: 5174,
    fs: {
      allow: [rootDir, repoDir]
    },
    watch: {
      ignored: ['**/.build/**', '**/dist/**']
    }
  }
})
