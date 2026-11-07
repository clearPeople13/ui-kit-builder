import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { apiPlugin } from '../../scripts/dev-api.mjs'
import { consumerPort } from '../../scripts/worktree-ports.mjs'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const repoDir = path.resolve(rootDir, '../..')
const configuratorDir = path.join(repoDir, 'configurator')
// F-67：node_modules/@demo 是 npm install 时生成的软链，在并行工作树里可能指向
// 另一棵工作树（主工作树）的 dist。调试台必须始终消费当前工作树刚构建的产物，
// 否则源码改完、界面依旧是旧版，单测与源码体检测不出来。
const distDir = path.join(repoDir, 'dist').replace(/\\/g, '/')

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
    dedupe: ['vue'],
    // 软链可能跨工作树，这里把 20 份 profile 的 JS 与样式显式钉到本工作树 dist。
    // 治理校验会静态核对这两条 alias，合并时别把它们覆盖掉。
    alias: [
      { find: /^@demo\/ui-kit-([a-z0-9-]+)\/style\.css$/, replacement: `${distDir}/$1/ui-kit.css` },
      { find: /^@demo\/ui-kit-([a-z0-9-]+)$/, replacement: `${distDir}/$1/ui-kit.js` }
    ]
  },
  server: {
    port: consumerPort,
    fs: {
      allow: [rootDir, repoDir]
    },
    watch: {
      ignored: ['**/.build/**', '**/dist/**']
    }
  }
})
