import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))

/**
 * 浏览器层只需要一个静态站点：以仓库根为 Vite root，
 * 这样 /tests/browser/harness/ 与 /dist/full/ 都在服务范围内，不需要额外拷贝产物。
 *
 * define 里补齐 Vue 的编译期特性开关：探针页直连 dist 产物 + esm-bundler 的 vue，
 * 不定义的话每次进页面都会刷一条 feature flags 告警，把"控制台归零"断言永久污染。
 */
export default async function setup() {
  const server = await createServer({
    root: repoRoot,
    configFile: false,
    logLevel: 'silent',
    define: {
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
    },
    server: { host: '127.0.0.1', port: 0, strictPort: false }
  })
  await server.listen()
  const address = server.httpServer?.address()
  if (!address || typeof address === 'string') {
    throw new Error('浏览器层探针服务未能监听端口')
  }
  process.env.UIKIT_HARNESS_BASE = `http://127.0.0.1:${address.port}/tests/browser/harness/index.html`
  return async () => {
    await server.close()
  }
}
