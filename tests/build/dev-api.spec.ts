import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { repoRoot } from './_helpers'

const devApi = (await import('../../scripts/dev-api.mjs')) as {
  createApiHandlers: () => {
    build: (rawBody: string) => Promise<{ status: number; payload: any }>
    estimate: (rawBody: string) => Promise<{ status: number; payload: any }>
    packages: () => { status: number; payload: { packages: Array<{ id: string; dir?: string }> } }
  }
  reservedProfileNames: () => Set<string>
  customPackageDir: (name: string) => string
}

/**
 * 构建器 UI 的 5 个接口此前只有手工点一遍，没有安全网。
 * handler 与 HTTP 通道分离后，node 环境可以直接覆盖"正常 / 400 / 保留名 409"三类分支，
 * 自定义包落盘位置也在同一条用例里锁住（F-66）。
 */
describe('dev-api 接口契约', () => {
  it('正式 profile 名是保留名，自定义包不能覆盖它们', async () => {
    const reserved = devApi.reservedProfileNames()
    expect(reserved.size).toBeGreaterThanOrEqual(20)
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
})
