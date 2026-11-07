import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { profileNames, repoRoot } from './_helpers'

type ApiResult = { status: number; payload: any }
type Handlers = {
  registry: () => Promise<ApiResult>
  packages: () => ApiResult
  presets: () => ApiResult
  estimate: (rawBody: string) => Promise<ApiResult>
  build: (rawBody: string) => Promise<ApiResult>
}
type RouteHandler = (request: any, response: any) => void | Promise<void>

const devApi = (await import('../../scripts/dev-api.mjs')) as {
  createApiHandlers: () => Handlers
  apiPlugin: () => {
    configureServer: (server: { middlewares: { use: (route: string, handler: RouteHandler) => void } }) => void
  }
  reservedProfileNames: () => Set<string>
  customPackageDir: (name: string) => string
}
const { profileCatalog } = (await import('../../scripts/profile-catalog.mjs')) as {
  profileCatalog: (rootDir: string) => Array<{ dirName: string; label: string }>
}
const catalog = profileCatalog(repoRoot)
const catalogLabels = new Map(catalog.map((entry) => [entry.dirName, entry.label]))

// ---- HTTP 层的最小替身：只实现中间件注册与请求/响应，足够覆盖 405 / 413 / 静态文件分支 ----

function createHarness() {
  const routes = new Map<string, RouteHandler>()
  devApi.apiPlugin().configureServer({
    middlewares: {
      use: (route, handler) => {
        routes.set(route, handler)
      }
    }
  })
  return routes
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '' as string | Buffer,
    ended: false,
    setHeader(name: string, value: string) {
      this.headers[name] = value
    },
    end(payload: string | Buffer = '') {
      this.body = payload
      this.ended = true
    }
  }
}

function createRequest(method: string, url: string) {
  const request = new EventEmitter() as EventEmitter & { method: string; url: string }
  request.method = method
  request.url = url
  return request
}

const jsonBody = (response: ReturnType<typeof createResponse>) =>
  JSON.parse(typeof response.body === 'string' ? response.body : response.body.toString('utf8'))

/**
 * 构建器 UI 的接口此前只有手工点一遍，没有安全网（B1）。
 * handler 与 HTTP 通道分离后，node 环境可以直接覆盖六类分支：
 * 正常返回、400 非法 JSON、413 请求体超限、405 方法不对、409 保留名、静态包文件。
 */
describe('dev-api 接口契约', () => {
  it('正式 profile 名是保留名，自定义包不能覆盖它们', async () => {
    const reserved = devApi.reservedProfileNames()
    expect(reserved.size).toBeGreaterThanOrEqual(profileNames.length)
    expect(reserved.has('full')).toBe(true)

    for (const name of ['full', 'core']) {
      const result = await devApi.createApiHandlers().build(JSON.stringify({ name, components: { button: [] } }))
      expect(result.status, `${name} 应被拒绝`).toBe(409)
      expect(result.payload.error).toContain('保留名')
    }
  })

  it('请求体不是合法 JSON 时返回 400', async () => {
    const handlers = devApi.createApiHandlers()
    expect((await handlers.build('{oops')).status).toBe(400)
    expect((await handlers.estimate('{oops')).status).toBe(400)
  })

  it('未选组件时试算直接返回 0，不触发构建', async () => {
    const result = await devApi.createApiHandlers().estimate('{"components":{}}')
    expect(result.status).toBe(200)
    expect(result.payload).toMatchObject({ components: 0, features: 0, totalBytes: 0 })
  })

  it('请求体不是对象时按空配置处理，而不是崩溃', async () => {
    const result = await devApi.createApiHandlers().estimate('null')
    expect(result.status).toBe(200)
    expect(result.payload).toMatchObject({ components: 0, totalBytes: 0 })
  })

  it('自定义包写到 dist/custom/<name>，并能从包列表读回', async () => {
    expect(devApi.customPackageDir('Demo Kit')).toBe('dist/custom/demo-kit')
    const handlers = devApi.createApiHandlers()
    const result = await handlers.build(
      JSON.stringify({ name: 'demo', prefix: 'ui', components: { button: [], tag: [] } })
    )
    expect(result.status).toBe(200)
    expect(result.payload.dir).toBe('dist/custom/demo')
    expect(result.payload.types).toContain('export')

    const dir = path.join(repoRoot, 'dist/custom/demo')
    expect(fs.existsSync(path.join(dir, 'meta.json'))).toBe(true)
    expect(fs.existsSync(path.join(dir, 'ui-kit.js'))).toBe(true)

    const packages = handlers.packages().payload.packages
    const demo = packages.find((item) => item.id === 'custom/demo')
    expect(demo, '自定义包应出现在 /api/packages 列表').toBeTruthy()

    // 正式产物的命名空间没有被自定义包污染
    expect(fs.existsSync(path.join(repoRoot, 'dist/full/meta.json'))).toBe(true)
  })

  it('自定义包名会被净化为目录名（空格 / 大写 / 符号）', async () => {
    const result = await devApi
      .createApiHandlers()
      .build(JSON.stringify({ name: 'Demo Kit!', components: { button: [] } }))
    expect(result.status).toBe(200)
    expect(result.payload.dir).toBe('dist/custom/demo-kit')
    expect(fs.existsSync(path.join(repoRoot, 'dist/custom/demo-kit/meta.json'))).toBe(true)
  })

  it('缺省名字落到 dist/custom/custom，不会占用正式 profile', async () => {
    const result = await devApi.createApiHandlers().build(JSON.stringify({ components: { button: [] } }))
    expect(result.status).toBe(200)
    expect(result.payload.dir).toBe('dist/custom/custom')
    expect(fs.existsSync(path.join(repoRoot, 'dist/full/package.json'))).toBe(true)
  })

  it('registry 返回 90 个组件、归一化后的属性类型与主题令牌', async () => {
    const result = await devApi.createApiHandlers().registry()
    expect(result.status).toBe(200)
    expect(result.payload.components).toHaveLength(90)
    expect(result.payload.tokens).toBeTruthy()
    const button = result.payload.components.find((item: any) => item.id === 'button')
    expect(button.exports.length).toBeGreaterThan(0)
    expect(typeof button.exports[0].coreProps[0].type).toBe('string')
  })

  it('packages 列出 20 份正式产物，label 直接来自 profiles 清单', async () => {
    const { status, payload } = devApi.createApiHandlers().packages()
    expect(status).toBe(200)
    const ids = payload.packages.map((item: any) => item.id)
    expect(ids.filter((id: string) => !id.startsWith('custom/')).sort()).toEqual([...profileNames].sort())
    const full = payload.packages.find((item: any) => item.id === 'full')
    expect(full.label).toBe(catalogLabels.get('full'))
    for (const item of payload.packages) {
      if (item.id.startsWith('custom/')) {
        expect(item.label).toBeTruthy()
      }
    }
    // 正式包按 profile order 排，core 在最前
    expect(ids[0]).toBe('core')
  })

  it('presets 的 label / 主题令牌与 profiles 清单一致', async () => {
    const { status, payload } = devApi.createApiHandlers().presets()
    expect(status).toBe(200)
    expect(payload.presets.length).toBeGreaterThanOrEqual(15)
    for (const preset of payload.presets) {
      expect(preset.id, `${preset.id} 应有 profile 清单里的 label`).toBeTruthy()
      expect(preset.label).toBe(catalogLabels.get(preset.id) ?? preset.id)
      expect(preset.theme.global).toBeTruthy()
      expect(Array.isArray(preset.palette)).toBe(true)
      expect(preset.tokens).toBeGreaterThan(0)
    }
  })

  it.skipIf(process.env.UIKIT_NO_BUILD_CACHE === '1')(
    'estimate 选中 2 个组件返回正体积，同一组合命中缓存',
    async () => {
      const handlers = devApi.createApiHandlers()
      const body = JSON.stringify({ components: { button: [], tag: [] } })
      const first = await handlers.estimate(body)
      expect(first.status).toBe(200)
      expect(first.payload.components).toBe(2)
      expect(first.payload.totalBytes).toBeGreaterThan(0)

      const second = await handlers.estimate(body)
      expect(second.status).toBe(200)
      // 命中缓存时返回同一个对象引用，而不是重新打包
      expect(second.payload).toBe(first.payload)
    }
  )

  it('GET 之外的请求在中间件层返回 405，六条路由口径一致', async () => {
    const routes = createHarness()
    const cases = [
      ['/api/registry', 'POST', 'GET'],
      ['/api/packages', 'POST', 'GET'],
      ['/api/presets', 'POST', 'GET'],
      ['/packs', 'POST', 'GET'],
      ['/api/estimate', 'GET', 'POST'],
      ['/api/build', 'GET', 'POST']
    ] as const
    for (const [route, method, allowed] of cases) {
      const handler = routes.get(route)
      expect(handler, `${route} 应注册中间件`).toBeTypeOf('function')
      const response = createResponse()
      await handler!(createRequest(method, route), response)
      expect(response.statusCode, `${route} 的 ${method}`).toBe(405)
      expect(jsonBody(response).error).toContain(allowed)
    }
  })

  it('请求体超过 512 KB 时返回 413，而不是挂起请求', async () => {
    const routes = createHarness()
    for (const route of ['/api/estimate', '/api/build']) {
      const request = createRequest('POST', route)
      const response = createResponse()
      const task = routes.get(route)!(request, response) as Promise<void>
      request.emit('data', 'x'.repeat(600 * 1024))
      request.emit('end')
      await task
      expect(response.statusCode, route).toBe(413)
      expect(jsonBody(response).error).toContain('请求体过大')
    }
  })

  it('/packs 直出包文件并带正确 MIME，路径穿越与缺失文件分别 400 / 404', async () => {
    const routes = createHarness()
    const jsResponse = createResponse()
    await routes.get('/packs')!(createRequest('GET', '/packs/full/ui-kit.js'), jsResponse)
    expect(jsResponse.statusCode).toBe(200)
    expect(jsResponse.headers['Content-Type']).toContain('text/javascript')
    expect((jsResponse.body as Buffer).length).toBeGreaterThan(0)

    const traversal = createResponse()
    await routes.get('/packs')!(createRequest('GET', '/packs/full/..%2Fsecret'), traversal)
    expect(traversal.statusCode).toBe(400)

    const missing = createResponse()
    await routes.get('/packs')!(createRequest('GET', '/packs/full/nope.js'), missing)
    expect(missing.statusCode).toBe(404)
  })
})
