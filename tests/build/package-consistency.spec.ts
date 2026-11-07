import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadTestRegistry, repoRoot } from './_helpers'

const { profileCatalog } = (await import('../../scripts/profile-catalog.mjs')) as {
  profileCatalog: (rootDir?: string) => Array<{ dirName: string }>
}

/**
 * A8：版本、engines 与 license 只能有一个事实源。
 *
 * registry.mjs 直接读 root package.json 的 version，产物 package.json 又用 registry.version，
 * 所以三处（root / registry / dist 各包）必须同时对齐；消费方的 `file:` 依赖不写版本号，
 * 升级时跟着产物走，避免出现"包版本变了、示例还锁旧版"的静默漂移。
 */
type PackageMeta = {
  name?: string
  version: string
  license?: string
  engines?: Record<string, string>
  dependencies?: Record<string, string>
}

const rootPackage = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageMeta

function readPackage(relativePath: string): PackageMeta {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')) as PackageMeta
}

describe('版本、engines 与 license 的单一事实源（A8）', () => {
  it('registry 版本与 root package.json 一致', async () => {
    const registry = await loadTestRegistry()
    expect(registry.version).toBe(rootPackage.version)
  })

  it('每条 profile 产物的 version / license / engines 与 root 一致', () => {
    for (const entry of profileCatalog()) {
      const pkg = readPackage(`dist/${entry.dirName}/package.json`)
      expect(
        { version: pkg.version, license: pkg.license, engines: pkg.engines },
        `dist/${entry.dirName}/package.json 与 root 不一致，请重新运行 npm run build:all`
      ).toEqual({ version: rootPackage.version, license: rootPackage.license, engines: rootPackage.engines })
    }
  })

  it('消费方 file: 依赖不带版本号，升级随产物走', () => {
    const consumer = readPackage('examples/consumer/package.json')
    for (const [name, spec] of Object.entries(consumer.dependencies ?? {})) {
      if (!name.startsWith('@demo/ui-kit-')) {
        continue
      }
      expect(spec, `${name} 必须用 file: 指向 dist 产物`).toMatch(/^file:\.\.\/\.\.\/dist\//)
    }
    expect(consumer.dependencies?.['ui-kit-feature-build-demo']).toBe('file:../..')
  })
})
