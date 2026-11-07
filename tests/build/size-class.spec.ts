import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { exists, readText, repoRoot } from './_helpers'

/**
 * size / 状态修饰类词形守卫（A22）：尺寸类只许 `--size-<值>`，状态类只许 `is-<状态>`。
 *
 * 历史漂移：尺寸类三套并存（`--size-*` / `is-size-*` / 裸 `--small|--large`），
 * 状态类漂移出 `--closable|--loading|--vertical`（多数派是 `is-*`）。
 * 收敛证据见 REQUIREMENTS.md §32.1（F-104）。本守卫用源码扫描把词形钉死，
 * 新增漂移词形会在 test:build 当场报出文件与命中行。
 */

// A22 收敛时核验过零渲染点、保持零声明的组件不需要豁免；
// 唯一豁免是 tabs：F-99  wave 正在改 tabs 核心，其 --closable 尾巴随该 wave 一并归并（§32.1 台账）
const EXEMPT_COMPONENTS = new Set(['tabs'])

const FORBIDDEN = [
  { pattern: /is-size-[a-z]/, label: '尺寸类 is-size-*（应为 --size-*）' },
  {
    pattern: /(?<![\w-])--(small|large|mini|sm|lg|xl|xs)(?![\w-])/,
    label: '裸尺寸档位类 --small/--large/...（应为 --size-*）'
  },
  {
    pattern: /(?<![\w-])--(closable|loading|vertical)(?![\w-])/,
    label: '状态类 --closable/--loading/--vertical（应为 is-*）'
  }
]

function componentIds(): string[] {
  const dir = path.join(repoRoot, 'packages/ui-kit/src/components')
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && exists(`packages/ui-kit/src/components/${entry.name}/spec.mjs`))
    .map((entry) => entry.name)
}

function scanFiles(componentId: string): Array<{ file: string; text: string }> {
  const base = `packages/ui-kit/src/components/${componentId}`
  const files: Array<{ file: string; text: string }> = []
  for (const name of ['core.ts', 'core.css']) {
    if (exists(`${base}/${name}`)) {
      files.push({ file: `${base}/${name}`, text: readText(`${base}/${name}`) })
    }
  }
  const featuresDir = `${base}/features`
  if (exists(featuresDir)) {
    for (const file of fs.readdirSync(path.join(repoRoot, featuresDir), { recursive: true })) {
      if (typeof file === 'string' && /\.(ts|css)$/.test(file)) {
        files.push({ file: `${featuresDir}/${file}`, text: readText(`${featuresDir}/${file}`) })
      }
    }
  }
  return files
}

describe('size / 状态修饰类词形守卫（A22）', () => {
  it('组件源码（ts/css/features）不再出现已收敛的漂移词形', () => {
    const hits: string[] = []
    for (const componentId of componentIds()) {
      if (EXEMPT_COMPONENTS.has(componentId)) {
        continue
      }
      for (const { file, text } of scanFiles(componentId)) {
        const lines = text.split('\n')
        for (const { pattern, label } of FORBIDDEN) {
          lines.forEach((line, index) => {
            // 字符串内容（如 demo 文案、注释里引用旧词形说明）不算漂移，只扫 class 语境：
            // ts 里的 class/className 模板与 css 选择器行
            const inClassContext = file.endsWith('.css') || /class(Name)?\s*[:=]|\$\{|baseClass|--size|is-/.test(line)
            if (inClassContext && pattern.test(line)) {
              hits.push(`${file}:${index + 1} ${label} → ${line.trim().slice(0, 80)}`)
            }
          })
        }
      }
    }
    expect(hits, `发现漂移词形（tabs 为 F-99 wave 登记豁免）：\n${hits.join('\n')}`).toEqual([])
  })
})
