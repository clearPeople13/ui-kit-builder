import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { readJson, repoRoot } from './_helpers'

/**
 * demo/meta.json 的新鲜度守卫（B5）。
 *
 * `examples/consumer/src/demo/meta.json` 是 `npm run meta:demo` 从 dist 各包的 meta.json 生成的派生数据，
 * 但生成脚本不进门禁，改完 profile 忘了重新生成时，调试台会展示旧的包集合 / 体积 / 组件清单。
 * 这组用例把三件事和产物逐一比对，报红时直接给出重新生成命令。
 */

type DistMeta = {
  name: string
  prefix: string
  components: string[]
  features?: string[]
  jsBytes: number
  cssBytes: number
  totalBytes: number
  gzipBytes: number
}

type DemoPackage = {
  id: string
  npm: string
  prefix: string
  components: string[]
  features?: string[]
  sizes: { js: number; css: number; total: number; gzip: number }
}

const REGENERATE = '请重新运行 `npm run meta:demo` 并提交 examples/consumer/src/demo/meta.json'

const demo = readJson<{ packages: DemoPackage[] }>('examples/consumer/src/demo/meta.json')
const consumerDeps = Object.keys(
  readJson<{ dependencies?: Record<string, string> }>('examples/consumer/package.json').dependencies ?? {}
)
const distDir = path.join(repoRoot, 'dist')

// 与 generate-demo-meta 同规则：dist/ 下有 meta.json + package.json，且包名在消费方依赖里
const distMetas = new Map<string, { pkgName: string; meta: DistMeta }>()
for (const entry of fs.existsSync(distDir) ? fs.readdirSync(distDir, { withFileTypes: true }) : []) {
  if (!entry.isDirectory()) {
    continue
  }
  const metaPath = path.join(distDir, entry.name, 'meta.json')
  const pkgPath = path.join(distDir, entry.name, 'package.json')
  if (!fs.existsSync(metaPath) || !fs.existsSync(pkgPath)) {
    continue
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name: string }
  if (consumerDeps.includes(pkg.name)) {
    distMetas.set(entry.name, { pkgName: pkg.name, meta: JSON.parse(fs.readFileSync(metaPath, 'utf8')) })
  }
}

describe('demo/meta.json 与构建产物一致', () => {
  it('包集合与消费方依赖内的 dist 产物一一对应', () => {
    const demoIds = demo.packages.map((item) => item.id).sort()
    const expectedIds = [...distMetas.keys()].sort()
    expect(demoIds, `包集合不一致，${REGENERATE}`).toEqual(expectedIds)
    for (const item of demo.packages) {
      const dist = distMetas.get(item.id)
      expect(dist, `${item.id} 在 dist/ 里没有对应产物，${REGENERATE}`).toBeDefined()
      expect(item.npm).toBe(dist!.pkgName)
      expect(item.prefix).toBe(dist!.meta.prefix)
    }
  })

  it('每个包的体积与 dist/<id>/meta.json 完全一致', () => {
    for (const item of demo.packages) {
      const meta = distMetas.get(item.id)!.meta
      expect(item.sizes, `${item.id} 的体积已过期，${REGENERATE}`).toEqual({
        js: meta.jsBytes,
        css: meta.cssBytes,
        total: meta.totalBytes,
        gzip: meta.gzipBytes
      })
    }
  })

  it('组件清单与特性清单与 dist/<id>/meta.json 完全一致', () => {
    for (const item of demo.packages) {
      const meta = distMetas.get(item.id)!.meta
      expect(item.components, `${item.id} 的组件清单已过期，${REGENERATE}`).toEqual(meta.components)
      expect(item.features ?? [], `${item.id} 的特性清单已过期，${REGENERATE}`).toEqual(meta.features ?? [])
    }
  })
})
