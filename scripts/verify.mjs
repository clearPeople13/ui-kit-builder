import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildAllProfiles } from './build-all.mjs'
import { loadRegistry } from '../registry.mjs'

globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
let passed = 0
const failures = []

function assert(condition, message) {
  if (condition) {
    passed += 1
  } else {
    failures.push(message)
  }
}

function assertIncludes(content, needle, label) {
  assert(String(content).includes(needle), `${label} 应包含 ${needle}`)
}

async function render(result, componentName, props, slots) {
  const { createSSRApp, h } = await import('vue')
  const { renderToString } = await import('@vue/server-renderer')
  const moduleUrl = `${pathToFileURL(path.join(rootDir, result.dir, 'ui-kit.js')).href}?run=${Date.now()}`
  const module = await import(moduleUrl)
  assert(Boolean(module[componentName]), `${result.name} 应导出 ${componentName}`)
  return renderToString(
    createSSRApp({
      render: () => h(module[componentName], props, slots)
    })
  )
}

function writeTypeTests(registry, results) {
  const testDir = path.join(rootDir, '.build', 'type-tests')
  const componentIds = ['button', 'input', 'select', 'input-number', 'carousel', 'scrollbar', 'table', 'tree', 'upload']
  fs.rmSync(testDir, { recursive: true, force: true })
  fs.mkdirSync(testDir, { recursive: true })

  for (const result of results) {
    const lines = []
    const typeImports = new Set()
    const valueImports = new Set()

    for (const componentId of componentIds) {
      const spec = registry.components[componentId]
      if (!spec || !(componentId in result.selection)) {
        continue
      }
      const primary =
        spec.exports.find((item) => Object.keys(item.features ?? {}).length > 0) ??
        spec.exports.find((item) => item.coreProps.length > 0)
      if (!primary) {
        continue
      }
      const prefix = componentId.replace(/\W/g, '_')
      const enabledIds = new Set(result.selection[componentId] ?? [])
      const enabledFeatureProps = new Set()
      const disabledProps = new Map()
      const enabledMethods = new Set()
      const disabledMethods = new Map()

      for (const [featureId, feature] of Object.entries(primary.features ?? {})) {
        const enabled = enabledIds.has(featureId)
        for (const prop of feature.props ?? []) {
          if (enabled) {
            enabledFeatureProps.add(prop.name)
          } else if (!primary.coreProps.some((core) => core.name === prop.name)) {
            disabledProps.set(prop.name, featureId)
          }
        }
        for (const method of feature.methods ?? []) {
          if (enabled) {
            enabledMethods.add(method.name)
          } else if (!enabledMethods.has(method.name)) {
            disabledMethods.set(method.name, featureId)
          }
        }
      }

      typeImports.add(`${primary.name}Props`)
      lines.push(`export const ${prefix}Enabled: ${primary.name}Props = {`)
      for (const prop of primary.coreProps) {
        lines.push(`  ${JSON.stringify(prop.name)}: undefined,`)
      }
      for (const propName of enabledFeatureProps) {
        lines.push(`  ${JSON.stringify(propName)}: undefined,`)
      }
      lines.push('}')
      lines.push('')

      for (const [propName, featureId] of disabledProps) {
        lines.push(
          `export const ${prefix}Rejects_${featureId.replace(/\W/g, '_')}_${propName.replace(/\W/g, '_')}: ${primary.name}Props = {`
        )
        lines.push(`  // @ts-expect-error ${featureId} 未启用，${propName} 不应存在`)
        lines.push(`  ${JSON.stringify(propName)}: undefined,`)
        lines.push('}')
        lines.push('')
      }

      if (!enabledMethods.size && !disabledMethods.size) {
        continue
      }

      typeImports.add(`${primary.name}Props`)
      typeImports.add(`${primary.name}Instance`)

      for (const methodName of enabledMethods) {
        disabledMethods.delete(methodName)
        lines.push(
          `export const ${prefix}Method_${methodName}: ${primary.name}Instance['${methodName}'] = (null as unknown as ${primary.name}Instance).${methodName}`
        )
      }
      if (enabledMethods.size) {
        valueImports.add(primary.name)
        lines.push(
          `export const ${prefix}MethodViaValue = (null as unknown as InstanceType<typeof ${primary.name}>).${
            [...enabledMethods][0]
          }`
        )
      }
      for (const [methodName, featureId] of disabledMethods) {
        lines.push(`// @ts-expect-error ${featureId} 未启用，方法 ${methodName} 不应存在`)
        lines.push(
          `export const ${prefix}RejectsMethod_${featureId.replace(/\W/g, '_')}_${methodName}: ${primary.name}Instance['${methodName}'] = (null as unknown as ${primary.name}Instance).${methodName}`
        )
      }
      lines.push('')
    }

    const header = []
    if (typeImports.size) {
      header.push(`import type { ${[...typeImports].join(', ')} } from '../../dist/${result.name}/index'`)
    }
    if (valueImports.size) {
      header.push(`import { ${[...valueImports].join(', ')} } from '../../dist/${result.name}/index'`)
    }
    header.push('')
    fs.writeFileSync(path.join(testDir, `${result.name}.ts`), [...header, ...lines].join('\n'), 'utf8')
  }

  const tsconfigPath = path.join(testDir, 'tsconfig.json')
  fs.writeFileSync(
    tsconfigPath,
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          noEmit: true,
          types: [],
          lib: ['ES2022', 'DOM']
        },
        include: ['./*.ts']
      },
      null,
      2
    )}\n`,
    'utf8'
  )

  return tsconfigPath
}

function runTypeTests(tsconfigPath) {
  try {
    execFileSync(
      process.execPath,
      [path.join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc'), '--project', tsconfigPath],
      { cwd: rootDir, stdio: 'pipe' }
    )
    assert(true, '各包的 TypeScript 消费者类型测试应通过')
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.toString().trim()
    failures.push(`类型测试未通过:\n${output}`)
  }
}

async function main() {
  const registry = await loadRegistry()
  // 门禁里 build:all 已先跑过一次，--reuse 直接读 sizes.json，避免 verify 再打 198 份包；
  // 单独执行 npm run verify 仍走完整构建，保证"产物是当前源码的事实"。
  const reuse = process.argv.includes('--reuse')
  const { results } = await buildAllProfiles({ reuse })
  const byName = Object.fromEntries(results.map((result) => [result.name, result]))
  const core = byName.core
  const full = byName.full

  // 组件数量以磁盘上的组件目录为准，新增/删除组件不需要再回来改这里的魔数
  const componentDirs = fs
    .readdirSync(path.join(rootDir, 'packages/ui-kit/src/components'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).length
  assert(
    registry.order.length === componentDirs,
    `组件数量应为目录数 ${componentDirs}，实际注册 ${registry.order.length}`
  )
  assert(registry.order.includes('icon'), '应包含 Icon 组件')
  assert(registry.order.includes('scrollbar'), '应包含 Scrollbar 组件')
  const exportNames = Object.values(registry.components).flatMap((spec) => spec.exports.map((item) => item.name))
  assert(exportNames.length >= registry.order.length, `导出数量应不少于组件数，实际 ${exportNames.length}`)
  assert(new Set(exportNames).size === exportNames.length, '导出名不应重复')

  // 产物文本、令牌、d.ts 细节已迁到 tests/build/**（F-83）：
  // verify 只留三类——产物存在性 / 导出冒烟 / SSR 冒烟，避免同一事实两套断言各自漂移。

  const tsconfigPath = writeTypeTests(registry, results)
  runTypeTests(tsconfigPath)

  const coreButtonHtml = await render(core, 'Button', { type: 'primary', bgColor: '#3366ff' })
  assert(coreButtonHtml.includes('ui-button'), 'core SSR 应渲染按钮')
  assert(!coreButtonHtml.includes('ui-button--bg-color'), 'core SSR 不应包含背景色特性类')
  assert(!/style="[^"]*background-color/.test(coreButtonHtml), 'core SSR 不应出现背景色内联样式')

  const bgHtml = await render(full, 'Button', { bgColor: '#3366ff', autoContrast: true })
  assert(/style="[^"]*background-color/.test(bgHtml), 'full SSR 应出现背景色内联样式')
  assert(bgHtml.includes('#3366ff'), 'full SSR 应使用传入的背景色')
  assert(/color:\s*(#ffffff|#fff)/i.test(bgHtml), 'full SSR 应计算白色前景')
  assert(bgHtml.includes('ui-button--bg-color'), 'full SSR 应包含背景色特性类')

  const gradientHtml = await render(full, 'Button', {
    bgColor: '#3366ff',
    gradient: true,
    gradientAngle: 45
  })
  assert(gradientHtml.includes('linear-gradient(45deg'), 'full SSR 应渲染渐变')

  const scrollbarHtml = await render(
    full,
    'Scrollbar',
    { height: 120 },
    {
      default: () => 'scroll-content'
    }
  )
  for (const token of [
    'ui-scrollbar',
    'ui-scrollbar__wrap',
    'ui-scrollbar__view',
    'ui-scrollbar__bar',
    'ui-scrollbar__thumb',
    'scroll-content'
  ]) {
    assertIncludes(scrollbarHtml, token, 'Scrollbar SSR')
  }

  const inputHtml = await render(full, 'Input', { modelValue: 'hello', placeholder: 'Name' })
  assertIncludes(inputHtml, 'ui-input', 'Input SSR')
  assertIncludes(inputHtml, 'placeholder="Name"', 'Input SSR')

  const tableHtml = await render(full, 'Table', { data: [{ name: 'A' }] })
  assertIncludes(tableHtml, 'ui-table', 'Table SSR')

  const emptyHtml = await render(core, 'Empty', {})
  assertIncludes(emptyHtml, 'ui-icon', 'Empty SSR 图标容器')
  assertIncludes(emptyHtml, '<svg', 'Empty SSR 应渲染 SVG 图标')

  const alertHtml = await render(full, 'Alert', { type: 'success', title: 'T', showIcon: true })
  assertIncludes(alertHtml, 'ui-alert--icons', 'Alert SSR 图标特性')
  assertIncludes(alertHtml, '<svg', 'Alert SSR 应渲染 SVG 图标')

  const namedIconHtml = await render(full, 'Icon', { name: 'close', size: 20 })
  assertIncludes(namedIconHtml, 'ui-icon', 'Icon SSR 内置图标名容器')
  assertIncludes(namedIconHtml, '<svg', 'Icon SSR 内置图标名应渲染 SVG')

  const { createSSRApp, h } = await import('vue')
  const { renderToString } = await import('@vue/server-renderer')
  const gatewayUrl = `${pathToFileURL(path.join(rootDir, full.dir, 'ui-kit.js')).href}?gateway=${Date.now()}`
  const gatewayModule = await import(gatewayUrl)
  assert(typeof gatewayModule.registerIcon === 'function', 'full 应导出 registerIcon')
  assert(typeof gatewayModule.resolveIcon === 'function', 'full 应导出 resolveIcon')
  assert(Boolean(gatewayModule.UI_ICONS?.close), 'full 应导出内置图标清单')
  gatewayModule.registerIcon('demoMark', { render: () => h('span', { class: 'demo-mark' }) })
  const registeredIconHtml = await renderToString(
    createSSRApp({ render: () => h(gatewayModule.Icon, { name: 'demoMark' }) })
  )
  assertIncludes(registeredIconHtml, 'demo-mark', 'Icon 应支持注册自定义图标')

  console.table(
    results.map((result) => ({
      profile: result.name,
      components: result.components.length,
      features: result.features.length,
      js: `${(result.jsBytes / 1024).toFixed(1)} kB`,
      css: `${(result.cssBytes / 1024).toFixed(1)} kB`,
      gzip: `${(result.gzipBytes / 1024).toFixed(1)} kB`
    }))
  )

  const logicTierNames = ['core', 'full']
  const logicTiers = results.filter((result) => logicTierNames.includes(result.name))
  assert(
    logicTiers.every((result, index) => index === 0 || result.jsBytes >= logicTiers[index - 1].jsBytes),
    '特性包 JS 体积应不小于前一档'
  )
  assert(
    results.every((result, index) => index === 0 || result.features.length >= results[index - 1].features.length),
    '按档位递进，特性数不应减少'
  )

  if (failures.length) {
    console.error(`\n${failures.length} 项检查失败:`)
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log(`\n全部 ${passed} 项检查通过。`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
