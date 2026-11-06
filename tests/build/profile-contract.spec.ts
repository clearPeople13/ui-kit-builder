import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { describe, expect, it } from 'vitest'
import {
  allBundles,
  allComponentsSelection,
  bundleOf,
  featureEntries,
  fullSelection,
  loadTestRegistry,
  profileNames,
  readJson,
  repoRoot,
  resolveSelection
} from './_helpers'

/**
 * profile 配置 → 构建产物的一致性契约。
 *
 * 这一层单测抓的是"构建器说谎"：meta.json / package.json / index.d.ts / sizes.json
 * 任何一个与真正打进包里的代码不一致，消费方按声明裁剪就会拿到错的东西。
 */

const registry = await loadTestRegistry()

describe('profile 选择结果', () => {
  it('20 份 profile 都产出了完整的四种文件', () => {
    for (const name of profileNames) {
      for (const file of ['ui-kit.js', 'ui-kit.css', 'index.d.ts', 'package.json', 'meta.json']) {
        expect(fs.existsSync(path.join(repoRoot, 'dist', name, file)), `${name} 缺 ${file}`).toBe(true)
      }
    }
  })

  it('meta.json 的名字与前缀来自 profile 配置并做过合法化', async () => {
    const { sanitizeName, sanitizePrefix } = (await import('../../scripts/build-lib.mjs')) as {
      sanitizeName: (value: string) => string
      sanitizePrefix: (value: string) => string
    }
    for (const bundle of allBundles()) {
      expect(bundle.meta.name).toBe(sanitizeName(bundle.config.name ?? bundle.profile))
      expect(bundle.meta.prefix).toBe(sanitizePrefix(bundle.config.prefix ?? 'ui'))
    }
  })

  it('selection 与按当前源码重新解析出的结果逐项一致（产物不过期）', () => {
    for (const name of profileNames) {
      const bundle = bundleOf(name)
      // 与 build-lib.mjs 的 resolveConfigSelection 走同一套入口，区别只在于这里是"重新算一遍"
      const requested =
        bundle.config.components === 'all'
          ? allComponentsSelection(registry)
          : bundle.config.components === 'full'
            ? fullSelection(registry)
            : bundle.config.components
      expect(bundle.meta.selection, `${name} selection 与当前源码不符`).toEqual(resolveSelection(registry, requested))
    }
  })

  it('components 与 selection 的键完全一致，且都来自 registry', () => {
    for (const bundle of allBundles()) {
      // activeComponents 取的是 Object.keys(selection)，icon 作为基础设施被提前插入，
      // 因此这里只约束"集合相同 + 都是注册表里的组件"，不约束顺序
      expect(bundle.meta.components).toEqual(Object.keys(bundle.meta.selection))
      expect([...bundle.meta.components].sort()).toEqual(
        registry.order.filter((id) => bundle.meta.selection[id]).sort()
      )
    }
  })

  it('features 是 registry 声明顺序下的特性 id，且不含重复项', () => {
    const declared = featureEntries(registry).map((entry) => entry.id)
    for (const bundle of allBundles()) {
      const selected = new Set(bundle.meta.features)
      const expected = [...new Set(declared.filter((id) => selected.has(id)))]
      expect(bundle.meta.features, `${bundle.profile} features`).toEqual(expected)
      expect(new Set(bundle.meta.features).size, `${bundle.profile} features 有重复 id`).toBe(
        bundle.meta.features.length
      )
    }
  })

  it('core 是唯一的零特性 profile，其余 19 份特性数与 full 相同', () => {
    const counts = Object.fromEntries(allBundles().map((bundle) => [bundle.profile, bundle.meta.features.length]))
    expect(counts.core).toBe(0)
    const fullCount = counts.full
    for (const [name, count] of Object.entries(counts)) {
      if (name === 'core') {
        continue
      }
      expect(count, `${name} 特性数应与 full 一致`).toBe(fullCount)
    }
    expect(fullCount).toBe(featureEntries(registry).length)
  })
})

describe('构建产物的自证信息', () => {
  it('meta.files 的字节数与 gzip 值就是磁盘上的真实值', () => {
    for (const bundle of allBundles()) {
      for (const file of bundle.meta.files) {
        const buffer = fs.readFileSync(path.join(repoRoot, 'dist', bundle.profile, file.file))
        expect(file.bytes, `${bundle.profile}/${file.file} 字节数`).toBe(buffer.length)
        expect(file.gzipBytes, `${bundle.profile}/${file.file} gzip`).toBe(zlib.gzipSync(buffer, { level: 9 }).length)
      }
    }
  })

  it('js/css/total/gzip 四个汇总值与文件表自洽', () => {
    for (const bundle of allBundles()) {
      const js = bundle.meta.files.filter((file) => file.file.endsWith('.js'))
      const css = bundle.meta.files.filter((file) => file.file.endsWith('.css'))
      expect(bundle.meta.jsBytes).toBe(js.reduce((total, file) => total + file.bytes, 0))
      expect(bundle.meta.cssBytes).toBe(css.reduce((total, file) => total + file.bytes, 0))
      expect(bundle.meta.totalBytes).toBe(bundle.meta.jsBytes + bundle.meta.cssBytes)
      // gzip 是对 js+css 拼接后整体压缩：必须能按同一段字节流原样复算出来
      const combined = Buffer.concat(
        bundle.meta.files.map((file) => fs.readFileSync(path.join(repoRoot, 'dist', bundle.profile, file.file)))
      )
      expect(bundle.meta.totalBytes).toBe(combined.length)
      expect(bundle.meta.gzipBytes).toBe(zlib.gzipSync(combined, { level: 9 }).length)
    }
  })

  it('dist/<profile>/meta.json 与 sizes.json 里的记录逐字段一致（sizes.json 不过期）', () => {
    const sizes = readJson<{ profiles: Record<string, any> }>('sizes.json')
    expect(Object.keys(sizes.profiles).sort()).toEqual(profileNames)
    for (const bundle of allBundles()) {
      const entry = sizes.profiles[bundle.profile]
      for (const key of [
        'prefix',
        'components',
        'selection',
        'features',
        'jsBytes',
        'cssBytes',
        'totalBytes',
        'gzipBytes'
      ] as const) {
        expect(entry[key], `${bundle.profile}.${key}`).toEqual(bundle.meta[key])
      }
    }
  })

  it('package.json 的 uiKit 段是 meta 的镜像，导出指针齐全', () => {
    for (const bundle of allBundles()) {
      const uiKit = bundle.packageJson.uiKit
      expect(uiKit.base).toBe(registry.name)
      expect(uiKit.profile).toBe(bundle.profile)
      expect(uiKit.prefix).toBe(bundle.prefix)
      expect(uiKit.components).toEqual(bundle.meta.selection)
      expect(uiKit.features).toEqual(bundle.meta.features)
      expect(bundle.packageJson.name).toBe(`${registry.name}-${bundle.profile}`)
      expect(bundle.packageJson.version).toBe(registry.version)
      expect(bundle.packageJson.types).toBe('./index.d.ts')
      expect(bundle.packageJson.peerDependencies.vue).toBe('^3.5.0')
      expect(bundle.packageJson.exports['./style.css']).toBe('./ui-kit.css')
    }
  })
})
