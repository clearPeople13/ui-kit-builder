#!/usr/bin/env node
/**
 * 一条命令跑完整门禁，并给出每个阶段的耗时与结论。
 * 与 `npm run quality` 的差别不是"又一套检查"，而是把检查变成可机读的产物：
 * 任何 runner（Gitee Go、Jenkins、本机 pre-push 钩子）都可以拿退出码 + ci-report.json 判定，
 * 不必去 grep 终端输出。
 *
 * 用法：
 *   node scripts/ci.mjs                 # 全量十二段（先 build 一次，后续各层复用产物）
 *   node scripts/ci.mjs --fast          # 只跑格式/类型/lint/库级校验（秒级，给 pre-commit 用）
 *   node scripts/ci.mjs --stage test    # 只跑名字里含 test 的阶段
 *   node scripts/ci.mjs --keep-going    # build / verify 失败后仍继续跑后续阶段（默认立即短路）
 */
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// fullScript：全量模式下已经先跑过 build:all，各层改用不带 pretest 的 run 脚本，
// 一次门禁只构建一轮；fast 模式用指纹校验过的 verify:reuse——产物没变就秒过，
// 源码变了自动重建，不会像裸 verify 那样每次 pre-commit 都重打 198 份包（C1）。
export const STAGES = [
  {
    name: 'build',
    script: 'build:all',
    fullOnly: true,
    desc: '统一构建：20 份 profile + 178 个特性边际产物（后续各层复用）'
  },
  { name: 'format', script: 'format:check', fast: true, desc: 'prettier 格式一致性' },
  { name: 'typecheck', script: 'typecheck', fast: true, desc: 'TypeScript 类型检查（库 + 用例两份工程）' },
  { name: 'lint', script: 'lint', fast: true, desc: 'ESLint' },
  {
    name: 'verify',
    script: 'verify:reuse',
    fast: true,
    desc: '库级校验（产物、API 一致性、令牌落盘；指纹一致时直接复用）'
  },
  {
    name: 'governance',
    script: 'verify:governance',
    fast: true,
    desc: '治理校验（影响面清单、特性裁剪静态守卫、缺陷编号与文档数字对齐）'
  },
  { name: 'test', script: 'test', fullScript: 'test:unit', desc: '组件单元测试（happy-dom）' },
  { name: 'test:build', script: 'test:build', fullScript: 'test:build:run', desc: '构建器侧契约' },
  {
    name: 'test:profiles',
    script: 'test:profiles',
    fullScript: 'test:profiles:run',
    desc: '20 份 profile 的运行时挂载'
  },
  {
    name: 'test:browser',
    script: 'test:browser',
    fullScript: 'test:browser:run',
    desc: '真实浏览器层（Playwright + Chromium + 布局 / 像素基线）'
  },
  {
    name: 'test:coverage',
    script: 'test:coverage',
    fullScript: 'test:coverage:run',
    desc: '源码覆盖率阈值（同一批组件用例在源码入口上重放）'
  },
  { name: 'consumer', script: 'verify:consumer', desc: '消费方校验（类型、负向用例、运行时）' }
]

// build 是后续各层的产物来源，verify 是产物 / API 一致性的第一道关；
// 这两段失败后继续跑只会拿到一串二次报错，掩盖真正原因，所以默认立即短路。
export const CRITICAL_STAGES = new Set(['build', 'verify'])

/**
 * 门禁阶段选择器：纯函数，便于直接用单元测试锁住 fast / --stage 的行为（B10）。
 */
export function selectStages({ fast = false, only = null } = {}) {
  return STAGES.filter(
    (stage) =>
      (!fast || (stage.fast && !stage.fullOnly)) && (!only || stage.name.includes(only) || stage.script.includes(only))
  )
}

function main(argv) {
  const fast = argv.includes('--fast')
  const keepGoing = argv.includes('--keep-going')
  const stageFlag = argv.indexOf('--stage')
  const only = stageFlag >= 0 ? argv[stageFlag + 1] : null

  const selected = selectStages({ fast, only })
  if (selected.length === 0) {
    console.error(`没有匹配的阶段：--stage ${only ?? ''}`)
    return 2
  }

  // 只有"全量模式且真的先跑了 build"时，后续阶段才能复用同一批产物改走 fullScript；
  // --stage 单跑或 fast 模式都没有这份保证，必须用各自会自行构建的原始脚本。
  const singleBuild = !fast && selected.some((stage) => stage.name === 'build')

  const results = []
  let failed = false
  let abortedBy = null

  // 在 npm 里跑时复用同一个 npm-cli.js（跨平台、不依赖 PATH 上的 shim）；
  // 直接被 node/钩子调起时才退回可执行文件名，Windows 上 .cmd 必须经 shell 才能起来
  const npmCli = process.env.npm_execpath
  const command = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm'

  for (const [index, stage] of selected.entries()) {
    const started = Date.now()
    const script = singleBuild && stage.fullScript ? stage.fullScript : stage.script
    process.stdout.write(`\n── ${stage.name} · ${stage.desc}\n`)
    const run = spawnSync(command, npmCli ? [npmCli, 'run', script] : ['run', script], {
      stdio: 'inherit',
      shell: !npmCli,
      encoding: 'utf8'
    })
    const durationMs = Date.now() - started
    const ok = run.status === 0
    failed = failed || !ok
    results.push({ stage: stage.name, script, ok, durationMs })
    process.stdout.write(
      `${ok ? '✓' : '✗'} ${stage.name} ${ok ? '通过' : '失败'}（${(durationMs / 1000).toFixed(1)}s）\n`
    )
    if (!ok && !keepGoing && CRITICAL_STAGES.has(stage.name)) {
      abortedBy = stage.name
      selected.slice(index + 1).forEach((skipped) => {
        results.push({ stage: skipped.name, script: skipped.script, ok: false, skipped: true, durationMs: 0 })
      })
      process.stdout.write(`\n${stage.name} 失败，后续阶段不再执行（--keep-going 可继续）\n`)
      break
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: fast ? 'fast' : only ? `stage:${only}` : 'full',
    ok: !failed,
    abortedBy,
    skipped: results.filter((item) => item.skipped).map((item) => item.stage),
    totalMs: results.reduce((sum, item) => sum + item.durationMs, 0),
    stages: results
  }
  writeFileSync(new URL('../ci-report.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`)

  process.stdout.write('\n阶段汇总\n')
  for (const item of results) {
    const mark = item.skipped ? '·' : item.ok ? '✓' : '✗'
    const detail = item.skipped ? '未执行' : `${(item.durationMs / 1000).toFixed(1)}s`
    process.stdout.write(`  ${mark} ${item.stage.padEnd(16)} ${detail}\n`)
  }
  process.stdout.write(`\n${report.ok ? '门禁通过' : '门禁失败'}，明细见 ci-report.json\n`)
  return report.ok ? 0 : 1
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (entryUrl === import.meta.url) {
  process.exit(main(process.argv.slice(2)))
}
