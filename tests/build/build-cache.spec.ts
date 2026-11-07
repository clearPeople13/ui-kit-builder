import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { repoRoot } from './_helpers'

const buildAll = (await import('../../scripts/build-all.mjs')) as {
  componentFingerprint: (componentId: string) => string | null
  profileFingerprint: (profileName: string) => string | null
}

/**
 * 缓存的价值是"该失效时一定失效"。三条用例分别模拟一次真实改动的落点：
 * 组件源码、profile 配置、注册表。任一条失灵，都会让门禁吃到旧产物或旧边际。
 */
describe('构建缓存失效（A10 / C2 / C3）', () => {
  it('改组件源码只让该组件的缓存键变化', () => {
    const dir = path.join(repoRoot, 'packages/ui-kit/src/components/button')
    const probe = path.join(dir, '__cache_probe.tmp')
    // 上次异常退出（Windows 上 rm 偶发 EBUSY）可能留下探针：先清掉，before 才是"没有探针"的基线。
    // 否则 before 已经包含探针内容，再写入同样内容指纹不变 —— 表现为这条用例一次红一次绿。
    fs.rmSync(probe, { force: true, maxRetries: 3, retryDelay: 50 })
    const before = buildAll.componentFingerprint('button')
    expect(before).toMatch(/^[0-9a-f]{40}$/)
    try {
      fs.writeFileSync(probe, `probe-${Date.now()}-${Math.random()}`, 'utf8')
      expect(buildAll.componentFingerprint('button')).not.toBe(before)
    } finally {
      fs.rmSync(probe, { force: true, maxRetries: 3, retryDelay: 50 })
    }
    expect(buildAll.componentFingerprint('button')).toBe(before)
  })

  it('改 profile JSON 会让该 profile 的缓存键变化', () => {
    const file = path.join(repoRoot, 'profiles/core.json')
    const original = fs.readFileSync(file, 'utf8')
    const before = buildAll.profileFingerprint('core')
    try {
      const mutated = original.replace('"label":', '"cacheProbe": true,\n  "label":')
      expect(mutated).not.toBe(original)
      fs.writeFileSync(file, mutated, 'utf8')
      expect(buildAll.profileFingerprint('core')).not.toBe(before)
    } finally {
      fs.writeFileSync(file, original, 'utf8')
    }
    expect(buildAll.profileFingerprint('core')).toBe(before)
  })

  it('改被引用但未被该组件选中的兄弟组件源码：引用方（table）与 profile 的缓存键都变化（A2）', () => {
    // table/tree/tree-v2/transfer 都 import checkbox/core：闭包外的兄弟组件源码变化
    // 必须让引用方的组件级缓存键与含它的 profile 缓存键失效，否则门禁复用陈旧产物。
    const dir = path.join(repoRoot, 'packages/ui-kit/src/components/checkbox')
    const probe = path.join(dir, '__cache_probe.tmp')
    fs.rmSync(probe, { force: true, maxRetries: 3, retryDelay: 50 })
    const tableBefore = buildAll.componentFingerprint('table')
    const buttonBefore = buildAll.componentFingerprint('button')
    const profileBefore = buildAll.profileFingerprint('full')
    expect(tableBefore).toBeTruthy()
    try {
      fs.writeFileSync(probe, `probe-${Date.now()}-${Math.random()}`, 'utf8')
      expect(buildAll.componentFingerprint('table')).not.toBe(tableBefore)
      expect(buildAll.profileFingerprint('full')).not.toBe(profileBefore)
      // 引用闭包隔离：不引用 checkbox 的 button 组件级缓存键不受影响
      expect(buildAll.componentFingerprint('button')).toBe(buttonBefore)
    } finally {
      fs.rmSync(probe, { force: true, maxRetries: 3, retryDelay: 50 })
    }
    expect(buildAll.componentFingerprint('table')).toBe(tableBefore)
  })

  it('改 tsconfig.json（esbuild/vite 会读）会让组件与 profile 的缓存键同时变化（A2）', () => {
    const file = path.join(repoRoot, 'tsconfig.json')
    const original = fs.readFileSync(file, 'utf8')
    const componentBefore = buildAll.componentFingerprint('button')
    const profileBefore = buildAll.profileFingerprint('core')
    try {
      fs.writeFileSync(file, `${original}\n// cache probe\n`, 'utf8')
      expect(buildAll.componentFingerprint('button')).not.toBe(componentBefore)
      expect(buildAll.profileFingerprint('core')).not.toBe(profileBefore)
    } finally {
      fs.writeFileSync(file, original, 'utf8')
    }
    expect(buildAll.componentFingerprint('button')).toBe(componentBefore)
  })

  it('改注册表会让组件与 profile 的缓存键同时变化', () => {
    const file = path.join(repoRoot, 'registry.mjs')
    const original = fs.readFileSync(file, 'utf8')
    const componentBefore = buildAll.componentFingerprint('button')
    const profileBefore = buildAll.profileFingerprint('full')
    try {
      fs.writeFileSync(file, `${original}\n// cache probe\n`, 'utf8')
      expect(buildAll.componentFingerprint('button')).not.toBe(componentBefore)
      expect(buildAll.profileFingerprint('full')).not.toBe(profileBefore)
    } finally {
      fs.writeFileSync(file, original, 'utf8')
    }
  })
})
