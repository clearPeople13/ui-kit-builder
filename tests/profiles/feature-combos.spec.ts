import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { componentExports, sweepMount, type MountSweep, type Profile } from './_load'

/**
 * 特性中间组合抽样（A15）。
 *
 * every-profile.spec.ts 只覆盖"全开（full）/全关（core）"两端；
 * 有依赖关系的特性被单独关掉、依赖仍保留时产物还能不能跑，此前没有任何运行时校验。
 *
 * 样本不从计划文档抄，从注册表实际推导：requires 非空的特性按依赖对抽样
 * （当前共三对：button.gradient→button.bg-color、cascader.select-all→cascader.multiple、
 * table.column-sort→table.sort）。每份样本现场构建一个"仅关闭该特性、其余全开"的
 * 临时产物，再用与 profiles 层一致的 sweepMount 全量挂载冒烟。
 *
 * 两个实现口径说明：
 * - requires 关系直接 import 各组件的 spec.mjs 读取（registry.mjs 在本层 import 不了，
 *   它顶层用了 import.meta.url，而 profiles 配置的 happy-dom 环境会改写它）；
 * - "其余全开"的选择集取 dist/full/meta.json 的 selection——profiles 层的既有前提就是
 *   dist 已由 build:all 备好，与 every-profile.spec.ts 相同；
 * - 组合产物用 scripts/build-lib.mjs 的真实 CLI 在子进程里构建（配置 JSON 落 .tmp/），
 *   同样因为 build-lib → registry.mjs 在本层无法 import，子进程则不受测试环境影响。
 *
 * 这些临时产物不落 dist/（避免被 every-profile 的 dist 扫描当成正式 profile）。
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

type SpecModule = {
  id: string
  exports: Array<{ name: string; features?: Record<string, { requires?: string[] }> }>
}

// 与 _load.ts 同一约定：vitest 从仓库根启动，cwd 即 repoRoot
const repoRoot = process.cwd()
const componentsDir = path.join(repoRoot, 'packages/ui-kit/src/components')

const kebab = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

async function loadComponentSpecs(): Promise<SpecModule[]> {
  const specs: SpecModule[] = []
  for (const entry of fs
    .readdirSync(componentsDir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) {
      continue
    }
    const specPath = path.join(componentsDir, entry.name, 'spec.mjs')
    if (!fs.existsSync(specPath)) {
      continue
    }
    const spec = (await import(/* @vite-ignore */ `${pathToFileURL(specPath).href}?v=${fs.statSync(specPath).mtimeMs}`))
      .default as SpecModule
    specs.push(spec)
  }
  return specs
}

type ComboSample = {
  /** 被单独关闭的特性 */
  featureId: string
  componentId: string
  /** 它声明的依赖，组合里必须保留 */
  requiredId: string
  /** 挂载冒烟时重点核对的导出名与基础结构 */
  probeExport: string
  probeClass: string
}

/** 从注册表推导依赖样本：requires 非空的特性，确定性排序 */
function deriveSamples(specs: SpecModule[]): ComboSample[] {
  const samples: ComboSample[] = []
  for (const spec of specs) {
    const features: Record<string, { requires?: string[] }> = Object.assign(
      {},
      ...spec.exports.map((item) => item.features ?? {})
    )
    for (const [featureId, feature] of Object.entries(features)) {
      for (const requiredId of feature.requires ?? []) {
        // 宿主核对用主导出（每个 spec 的第一个导出），不用持有该特性的导出：
        // 例如 table.column-sort 归 TableColumn，脱离 Table 上下文单独挂载渲染不出结构
        const probeExport = spec.exports[0]?.name ?? ''
        samples.push({
          featureId,
          componentId: spec.id,
          requiredId,
          probeExport,
          probeClass: `ui-${kebab(probeExport.replace(/^Ui/, ''))}`
        })
      }
    }
  }
  return samples.sort((left, right) => left.featureId.localeCompare(right.featureId))
}

const specs = await loadComponentSpecs()
const samples = deriveSamples(specs)

/** full 产物的选择集：组合样本 = 从这份清单里扣掉一个特性 */
const fullSelection = JSON.parse(fs.readFileSync(path.join(repoRoot, 'dist/full/meta.json'), 'utf8')) as {
  selection: Record<string, string[]>
}

const probeRoot = path.join(repoRoot, '.tmp', 'combo-probes')

function selectionWithout(featureId: string): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(fullSelection.selection).map(([componentId, featureIds]) => [
      componentId,
      featureIds.filter((id) => id !== featureId)
    ])
  )
}

async function loadProbe(dir: string, name: string): Promise<Profile> {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as {
    uiKit?: { prefix: string; components: Record<string, string[]> }
  }
  const module = (await import(
    /* @vite-ignore */ `${pathToFileURL(path.join(dir, 'ui-kit.js')).href}?run=${name}`
  )) as Record<string, any>
  return {
    name,
    prefix: pkg.uiKit?.prefix ?? 'ui',
    components: pkg.uiKit?.components ?? {},
    module,
    css: fs.readFileSync(path.join(dir, 'ui-kit.css'), 'utf8')
  }
}

describe('特性中间组合抽样（仅关特性、保留依赖）', () => {
  expect(samples.length, '注册表里 requires 非空的特性不足三对，抽样的覆盖承诺失效').toBeGreaterThanOrEqual(3)

  const probes = new Map<string, { profile: Profile; sweep: MountSweep }>()

  beforeAll(async () => {
    for (const sample of samples.slice(0, 3)) {
      const slug = sample.featureId.replace(/\W/g, '-')
      const dir = path.join(probeRoot, slug)
      const name = `combo-${slug}`
      // 配置 JSON 落在 .tmp/（已 gitignore）；outDir 走构建器支持的相对路径，
      // 产物不进 dist/，就不会被 every-profile 的 dist 扫描当成正式 profile
      const configPath = path.join(probeRoot, `${slug}.json`)
      fs.mkdirSync(probeRoot, { recursive: true })
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          name,
          prefix: 'ui',
          components: selectionWithout(sample.featureId),
          outDir: path.relative(repoRoot, dir),
          logLevel: 'silent'
        })
      )
      // 子进程跑真实 CLI：profiles 配置的 happy-dom 环境 import 不了 build-lib 的依赖链，
      // 进程外构建不受测试环境影响
      await execFileAsync(process.execPath, ['scripts/build-lib.mjs', '--config', configPath], {
        cwd: repoRoot,
        maxBuffer: 16 * 1024 * 1024
      })
      const profile = await loadProbe(dir, name)
      probes.set(sample.featureId, { profile, sweep: sweepMount(profile) })
    }
  }, 360_000)

  afterAll(() => {
    fs.rmSync(probeRoot, { recursive: true, force: true })
    for (const sample of samples.slice(0, 3)) {
      fs.rmSync(path.join(repoRoot, '.build', `combo-${sample.featureId.replace(/\W/g, '-')}`), {
        recursive: true,
        force: true
      })
    }
  })

  for (const sample of samples.slice(0, 3)) {
    describe(`${sample.featureId}（依赖 ${sample.requiredId} 保留）`, () => {
      const probe = () => {
        const hit = probes.get(sample.featureId)
        if (!hit || !hit.sweep) {
          throw new Error(`缺少 ${sample.featureId} 的构建产物`)
        }
        return hit
      }

      it('组合生效：该特性被关掉、requires 声明的依赖仍被选中', () => {
        const selected = probe().profile.components[sample.componentId] ?? []
        expect(selected).not.toContain(sample.featureId)
        expect(selected).toContain(sample.requiredId)
      })

      it('导出的组件全部挂得起来，且无裁剪相关的控制台告警', () => {
        const sweep = probe().sweep
        expect(componentExports(probe().profile).length).toBeGreaterThan(0)
        expect(sweep.failed).toEqual({})
        expect(sweep.noise.slice(0, 10)).toEqual([])
      })

      it(`宿主组件 ${sample.probeExport} 渲染出基础结构`, () => {
        const sweep = probe().sweep
        expect(sweep.mounted).toContain(sample.probeExport)
        expect(sweep.html[sample.probeExport]).toContain(sample.probeClass)
      })
    })
  }
})
