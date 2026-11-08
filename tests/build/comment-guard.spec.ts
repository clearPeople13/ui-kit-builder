import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { repoRoot } from './_helpers'

/**
 * 注释风格守卫（RULES.md §1 的机器化）。
 *
 * 全库审计结论：存量注释 2083 条里约 95% 是承重 why（隐藏约束 / 反直觉不变量 /
 * bug workaround），真正 objective 噪音只有分隔符式注释一类。所以本守卫只咬
 * "一定会再生"的机械噪音，不判 why 质量（那靠评审）：
 * - separator：// ---- xxx ---- / // ===== 这类分隔横幅。有信息就写成普通注释，没信息就删。
 * - placeholder：TODO / FIXME / XXX / HACK。要么现在做，要么登记 F-x，不留占位。
 * - empty：空注释行（`//` 后什么都没有）。
 *
 * 非空转证明见下方合成源自测：每种模式对构造源必命中；全库扫描（源码 + 脚本 +
 * 测试 + 演示台）必须与零命中完全一致——新增即红，含豁免清单反向校验思路：
 * 本守卫刻意不配 BASELINE，命中直接改代码，不登记。
 */

type PatternId = 'separator' | 'placeholder' | 'empty'

const PATTERN_TITLES: Record<PatternId, string> = {
  separator: '分隔横幅（// ---- xxx ---- / // =====），改成普通注释或删除',
  placeholder: '占位标记（TODO/FIXME/XXX/HACK），要么现在做要么登记 F-x',
  empty: '空注释行'
}

const PLACEHOLDER_RE = /\b(TODO|FIXME|XXX|HACK)\b/
const EMPTY_RE = /^\s*\/\/\s*$/

/** 分隔横幅：纯 // ---- / // =====，或 // ---- xxx ----（首尾都是横幅符）。// --stage 这类以双横线开头的普通说明不算 */
function isSeparator(trimmed: string): boolean {
  const rest = trimmed.replace(/^\/\/\s*[-=*]{2,}/, '').trimStart()
  if (/^[-=*\s]*$/.test(rest)) {
    return true
  }
  return /[-=*]{2,}\s*$/.test(rest)
}

function checkLine(line: string): PatternId[] {
  const trimmed = line.trim()
  if (!trimmed.startsWith('//')) {
    return []
  }
  const hits: PatternId[] = []
  if (/^\/\/\s*[-=*]{2,}/.test(trimmed) && isSeparator(trimmed)) {
    hits.push('separator')
  }
  if (PLACEHOLDER_RE.test(trimmed)) {
    hits.push('placeholder')
  }
  if (EMPTY_RE.test(trimmed)) {
    hits.push('empty')
  }
  return hits
}

function checkSource(source: string): Partial<Record<PatternId, number>> {
  const counts: Partial<Record<PatternId, number>> = {}
  for (const line of source.split('\n')) {
    for (const hit of checkLine(line)) {
      counts[hit] = (counts[hit] ?? 0) + 1
    }
  }
  return counts
}

const scanRoots = ['packages/ui-kit/src', 'scripts', 'tests', 'examples/consumer/src']

function targetFiles(): string[] {
  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        if (!/node_modules|dist|\.build/.test(entry)) {
          walk(full)
        }
      } else if (/\.(ts|mjs)$/.test(entry) && !entry.endsWith('.d.ts')) {
        files.push(full)
      }
    }
  }
  for (const root of scanRoots) {
    walk(path.join(repoRoot, root))
  }
  return files.sort()
}

describe('守卫自测：检查器必须会咬人', () => {
  const synthetic = [
    '// ---- 源码分类 ----',
    '// ===== 分隔线 =====',
    '// TODO: 之后再补',
    '// FIXME 先这样',
    '//',
    '//   ',
    'const ok = 2 // 普通中文注释不命中'
  ].join('\n')

  it('构造源里 3 种模式全部被命中', () => {
    expect(checkSource(synthetic)).toEqual({ separator: 2, placeholder: 2, empty: 2 })
  })

  it('合规源一种模式都不命中', () => {
    const clean = ['// 首窗实测后中位数即贴近真实分布，总高一次到位', 'const x = 1', ''].join('\n')
    expect(checkSource(clean)).toEqual({})
  })
})

describe('注释风格守卫（对源码/脚本/测试/演示台全量扫描）', () => {
  const violations: Array<{ file: string; line: number; pattern: PatternId; text: string }> = []
  for (const file of targetFiles()) {
    const rel = path.relative(repoRoot, file)
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        for (const pattern of checkLine(line)) {
          violations.push({ file: rel, line: index + 1, pattern, text: line.trim().slice(0, 80) })
        }
      })
  }

  it('全库零命中：新增注释噪音直接报红（不配 BASELINE，命中就改）', () => {
    expect(
      violations.length === 0
        ? []
        : violations.map((v) => `${v.file}:${v.line} → ${v.pattern}（${PATTERN_TITLES[v.pattern]}）: ${v.text}`),
      '分隔横幅改成普通注释或删；占位标记要么现在做要么登记 F-x；空注释行删掉。规范见 RULES.md §1'
    ).toEqual([])
  })
})
