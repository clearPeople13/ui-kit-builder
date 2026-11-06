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

function assertExcludes(content, needle, label) {
  assert(!String(content).includes(needle), `${label} 不应包含 ${needle}`)
}

function readFile(dir, file) {
  return fs.readFileSync(path.join(rootDir, dir, file), 'utf8')
}

function readOutput(result, extension) {
  const file = result.files.find((item) => item.file.endsWith(extension))
  if (!file) {
    throw new Error(`${result.name} 没有 ${extension} 产物`)
  }
  return readFile(result.dir, file.file)
}

function packageJsonOf(result) {
  return JSON.parse(readFile(result.dir, 'package.json'))
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
  const { results } = await buildAllProfiles()
  const byName = Object.fromEntries(results.map((result) => [result.name, result]))
  const core = byName.core
  const full = byName.full
  const branded = byName.branded

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

  const coreJs = readOutput(core, '.js')
  const coreCss = readOutput(core, '.css')
  const coreTypes = readFile(core.dir, 'index.d.ts')
  const fullJs = readOutput(full, '.js')
  const fullCss = readOutput(full, '.css')
  const fullTypes = readFile(full.dir, 'index.d.ts')
  const brandedJs = readOutput(branded, '.js')
  const brandedCss = readOutput(branded, '.css')
  const brandedTypes = readFile(branded.dir, 'index.d.ts')
  const cuteJs = readOutput(byName.cute, '.js')
  const cuteCss = readOutput(byName.cute, '.css')
  const chineseJs = readOutput(byName.chinese, '.js')
  const chineseCss = readOutput(byName.chinese, '.css')
  const antdJs = readOutput(byName.antd, '.js')
  const antdCss = readOutput(byName.antd, '.css')

  for (const token of [
    'ui-button',
    'ui-input',
    'ui-select',
    'ui-scrollbar',
    'ui-table',
    'ui-pagination',
    'ui-tree',
    'ui-icon'
  ]) {
    assertIncludes(coreJs, token, 'core JS')
  }
  for (const token of [
    'bgColor',
    'autoContrast',
    'gradientAngle',
    'ui-button--bg-color',
    'ui-button--gradient',
    'ui-input--clearable',
    'showPassword',
    'showWordLimit',
    'setActiveItem',
    'clearSelection',
    'clearFiles',
    'getCheckedNodes'
  ]) {
    assertExcludes(coreJs, token, 'core JS')
  }
  assertIncludes(coreCss, '.ui-button', 'core CSS')
  assertIncludes(coreCss, '.ui-icon', 'core CSS')
  assertIncludes(coreCss, '--ui-splitter-bar-bg: transparent', 'core CSS 分割条默认透明')
  assertExcludes(coreCss, '.ui-splitter{--ui-splitter-bar', 'core CSS 分割条基础变量收拢到全局')
  assertIncludes(coreCss, '--ui-splitter-bar-bg: #eef2f8', 'core CSS 分割条 hover 显示')
  assertIncludes(coreCss, '--ui-dialog-header-bg: transparent', 'core CSS 对话框头部默认透明')
  assertIncludes(coreCss, '--ui-drawer-footer-bg: transparent', 'core CSS 抽屉底部默认透明')
  assertIncludes(coreCss, '--ui-scrollbar-thumb', 'core CSS 滚动条变量')
  assertIncludes(coreCss, '.ui-scrollbar-hidden', 'core CSS 隐藏滚动条工具类')
  assertIncludes(coreCss, '::-webkit-scrollbar', 'core CSS 自定义滚动条')
  assertIncludes(coreCss, '.ui-cascader__column::-webkit-scrollbar', 'core CSS 级联列隐藏滚动条')
  assertIncludes(coreCss, '.ui-date-picker__time-list::-webkit-scrollbar', 'core CSS 日期时间列隐藏滚动条')
  assertIncludes(coreCss, '.ui-time-picker__list::-webkit-scrollbar', 'core CSS 时间列隐藏滚动条')
  assertIncludes(coreCss, '.ui-input-tag__text', 'core CSS InputTag 文本省略')
  assertIncludes(
    coreCss,
    'radial-gradient(circle,var(--ui-color-primary) 0 4px,transparent 4.5px)',
    'core CSS Radio 内圈半径'
  )
  for (const token of ['.ui-button--bg-color', '.ui-button--gradient', '.ui-input--clearable', '.ui-input--password']) {
    assertExcludes(coreCss, token, 'core CSS')
  }
  for (const token of [
    'bgColor',
    'autoContrast',
    'gradientAngle',
    'showPassword',
    'showWordLimit',
    'ButtonBgColorProps',
    'ButtonGradientProps',
    'setActiveItem',
    'clearSelection',
    'clearFiles',
    'getCheckedNodes',
    'InputMethods',
    'ScrollbarMethods'
  ]) {
    assertExcludes(coreTypes, token, 'core d.ts')
  }
  const inputCoreBlock = coreTypes.match(/export interface InputCoreProps \{[\s\S]*?\n\}/)?.[0] ?? ''
  assert(!inputCoreBlock.includes('clearable'), 'core d.ts Input 不应包含 clearable')
  assertIncludes(coreTypes, 'export interface IconCoreProps', 'core d.ts')
  assertIncludes(coreTypes, 'icon?: Component | string', 'core d.ts Icon 支持图标名')
  assertIncludes(coreTypes, 'export type UiIconName', 'core d.ts 图标名类型')
  assertIncludes(coreTypes, 'export declare function registerIcon', 'core d.ts 图标注册入口')
  assertIncludes(coreTypes, 'export declare const UI_ICONS', 'core d.ts 内置图标清单')
  assertIncludes(coreJs, 'registerIcon', 'core JS 图标网关')
  for (const exportName of exportNames) {
    assertIncludes(coreTypes, `export declare const ${exportName}:`, 'core d.ts')
  }
  assertIncludes(coreTypes, 'export type ButtonProps = ButtonCoreProps', 'core d.ts')
  assertIncludes(coreTypes, 'export declare const activeComponents:', 'core d.ts')

  assertIncludes(fullJs, 'bgColor', 'full JS')
  assertIncludes(fullJs, 'gradientAngle', 'full JS')
  assertIncludes(fullJs, 'autoInsertSpace', 'full JS')
  assertIncludes(fullCss, '.ui-button--gradient', 'full CSS')
  assertIncludes(fullTypes, 'gradientAngle', 'full d.ts')
  assertIncludes(fullTypes, 'ButtonGradientProps', 'full d.ts')
  assertIncludes(fullTypes, 'ButtonAppearanceProps', 'full d.ts')
  assertIncludes(fullTypes, 'ButtonAutoInsertSpaceProps', 'full d.ts')
  for (const token of [
    'InputMethods',
    'export type InputInstance',
    'focus: () => void',
    'clearSelection',
    'setActiveItem',
    'clearFiles',
    'getCheckedNodes',
    'ScrollbarMethods'
  ]) {
    assertIncludes(fullTypes, token, 'full d.ts 方法特性')
  }
  for (const token of ['setActiveItem', 'clearSelection', 'clearFiles', 'getCheckedNodes']) {
    assertIncludes(fullJs, token, 'full JS 方法特性')
  }

  assertIncludes(brandedJs, 'acme-button', 'branded JS 前缀')
  assertIncludes(brandedCss, '.acme-button', 'branded CSS 前缀')
  assertIncludes(brandedCss, '--acme-color-primary:#0f766e', 'branded CSS 全局主题')
  assertIncludes(brandedCss, '.acme-button{--acme-button-radius:10px', 'branded CSS 组件主题')
  assertIncludes(brandedCss, '--acme-dialog-header-bg:#f8fafc', 'branded CSS 对话框头部主题')
  assertIncludes(brandedCss, '--acme-drawer-footer-bg:#f1f5f9', 'branded CSS 抽屉底部主题')
  assertIncludes(brandedCss, '.acme-splitter{--acme-splitter-bar-bg:#eef2f8', 'branded CSS 分割条主题')
  assertIncludes(brandedCss, '--acme-splitter-bar-grip:#64748b', 'branded CSS 分割条抓手主题')
  assertIncludes(brandedCss, '--acme-scrollbar-thumb', 'branded CSS 滚动条变量前缀')
  assertIncludes(brandedCss, '.acme-scrollbar-hidden', 'branded CSS 隐藏滚动条工具类前缀')
  assertIncludes(brandedJs, '--acme-form-label-width', 'branded JS CSS 变量前缀')
  assertExcludes(brandedJs, '--ui-form-label-width', 'branded JS CSS 变量前缀')
  assertExcludes(brandedJs, 'ui-button', 'branded JS 前缀')
  assertExcludes(brandedCss, '--ui-', 'branded CSS 前缀')
  assertExcludes(brandedCss, '.ui-button', 'branded CSS 前缀')
  assertIncludes(brandedTypes, 'ButtonGradientProps', 'branded d.ts')

  assertIncludes(cuteJs, 'cute-button', 'cute JS 前缀')
  assertIncludes(cuteCss, '.cute-button', 'cute CSS 前缀')
  assertIncludes(cuteCss, '--cute-color-primary:#ff87b2', 'cute CSS 全局主题')
  assertIncludes(cuteCss, '--cute-button-radius: var(--cute-radius-small)', 'cute CSS 按钮圆角取自圆角标尺')
  assertIncludes(cuteCss, '--cute-button-active-transform:translateY(0) scale(0.97)', 'cute CSS 按钮按下回弹')
  assertIncludes(
    cuteCss,
    '--cute-step-process-icon-bg:linear-gradient(135deg, #ffa3c4, #ff87b2 55%, #ff7bab)',
    'cute CSS 主题特调令牌'
  )
  assertIncludes(cuteCss, '.cute-tag--primary.cute-tag--light', 'cute CSS 皮肤规则')
  assertIncludes(cuteCss, '--cute-menu-active-color: var(--cute-color-primary)', 'cute CSS 菜单激活色跟随主色')
  assertExcludes(cuteCss, '--ui-', 'cute CSS 前缀')
  assertExcludes(cuteCss, '.ui-button', 'cute CSS 前缀')
  assertExcludes(cuteJs, 'ui-button', 'cute JS 前缀')
  assertIncludes(chineseJs, 'chinese-button', 'chinese JS 前缀')
  assertIncludes(chineseCss, '.chinese-button', 'chinese CSS 前缀')
  assertIncludes(chineseCss, '--chinese-color-primary:#b23a2f', 'chinese CSS 全局主题')
  assertIncludes(chineseCss, '--chinese-button-radius: var(--chinese-radius-small)', 'chinese CSS 按钮圆角取自圆角标尺')
  assertIncludes(chineseCss, '--chinese-card-header-accent:inset 4px 0 0 #b23a2f', 'chinese CSS 主题特调令牌')
  assertIncludes(chineseCss, '.chinese-tag--primary.chinese-tag--light', 'chinese CSS 皮肤规则')
  assertIncludes(
    chineseCss,
    '.chinese-menu-item.is-active .chinese-menu-item__inner:before',
    'chinese CSS 菜单激活标记特调'
  )
  assertIncludes(chineseCss, '--chinese-menu-active-color:#b23a2f', 'chinese CSS 菜单激活色取自主题')
  assertIncludes(chineseCss, '@keyframes chinese-seal-pop', 'chinese CSS 印章动画随前缀改写')
  assertExcludes(chineseCss, '--ui-', 'chinese CSS 前缀')
  assertExcludes(chineseCss, '.ui-button', 'chinese CSS 前缀')
  assertExcludes(chineseJs, 'ui-button', 'chinese JS 前缀')

  assertIncludes(antdJs, 'antd-button', 'antd JS 前缀')
  assertIncludes(antdCss, '.antd-button', 'antd CSS 前缀')
  assertIncludes(antdCss, '--antd-color-primary:#1677ff', 'antd CSS 全局主题')
  assertIncludes(antdCss, '--antd-button-radius:6px', 'antd CSS 按钮圆角主题')
  assertIncludes(antdCss, '.antd-menu{--antd-menu-active-color:#1677ff', 'antd CSS 菜单激活色取自主题')
  assertIncludes(antdCss, '.antd-scrollbar{--antd-scrollbar-thumb-color:rgba(0, 0, 0, 0.25)', 'antd CSS 滚动条主题')
  assertIncludes(antdCss, '.antd-tag--primary.antd-tag--light', 'antd CSS 皮肤规则')
  assertExcludes(antdCss, '--ui-', 'antd CSS 前缀')
  assertExcludes(antdCss, '.ui-button', 'antd CSS 前缀')
  assertExcludes(antdJs, 'ui-button', 'antd JS 前缀')

  for (const result of results) {
    const pkg = packageJsonOf(result)
    assert(pkg.types === './index.d.ts', `${result.name} package.json 应导出类型`)
    assert(pkg.exports['.'].types === './index.d.ts', `${result.name} package.json exports 应导出类型`)
    assert(Boolean(pkg.peerDependencies.vue), `${result.name} package.json 应声明 vue peerDependency`)
    assert(Boolean(pkg.exports['./style.css']), `${result.name} package.json 应导出 style.css`)
    assert(pkg.uiKit.features.length === result.features.length, `${result.name} package.json 特性数应一致`)
    assert(
      Object.keys(pkg.uiKit.components).length === registry.order.length,
      `${result.name} package.json 组件数与注册表不一致`
    )
    assert(pkg.uiKit.prefix === result.prefix, `${result.name} package.json 前缀应一致`)
    // 特性清单以该 profile 自己的选择为准，不再按 profile 名字写死数量：
    // 写死会让"给全部主题打开某个特性"这类正常改动变成 15 项假失败
    for (const [componentId, featureIds] of Object.entries(result.selection)) {
      assert(
        JSON.stringify(pkg.uiKit.components[componentId]) === JSON.stringify(featureIds),
        `${result.name} package.json 的 ${componentId} 特性清单与 meta.selection 不一致`
      )
    }
  }

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
