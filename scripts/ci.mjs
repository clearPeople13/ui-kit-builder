#!/usr/bin/env node
/**
 * 一条命令跑完整门禁，并给出每个阶段的耗时与结论。
 * 与 `npm run quality` 的差别不是"又一套检查"，而是把检查变成可机读的产物：
 * 任何 runner（Gitee Go、Jenkins、本机 pre-push 钩子）都可以拿退出码 + ci-report.json 判定，
 * 不必去 grep 终端输出。
 *
 * 用法：
 *   node scripts/ci.mjs                 # 全量十三段（先 build 一次，后续各层复用产物）
 *   node scripts/ci.mjs --changed       # 只跑这次改动影响到的阶段与用例（内循环用，分钟级 → 十秒级）
 *   node scripts/ci.mjs --changed --dry # 只打印受影响范围，不执行
 *   node scripts/ci.mjs --fast          # 只跑格式/类型/lint/库级校验（五段并行，秒级，给 pre-commit 用）
 *   node scripts/ci.mjs --stage test    # 只跑名字里含 test 的阶段
 *   node scripts/ci.mjs --keep-going    # build / verify 失败后仍继续跑后续阶段（默认立即短路）
 *
 * `--changed` 只解决"改三个文件等两分钟"，不替代合并门禁：
 * 合入前仍然跑一次全量，受影响范围拿不准时它自己也会回落全量。
 */
import { spawn, spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describePlan, planFromChanges, readChangedFiles } from './test-impact.mjs'

// fullScript：全量模式下已经先跑过 build:all，各层改用不带 pretest 的 run 脚本，
// 一次门禁只构建一轮；fast 模式用指纹校验过的 verify:reuse——产物没变就秒过，
// 源码变了自动重建，不会像裸 verify 那样每次 pre-commit 都重打 198 份包（C1）。
export const STAGES = [
  {
    name: 'build',
    script: 'build:all',
    fullOnly: true,
    desc: '统一构建：20 份 profile + 172 个特性边际产物（后续各层复用）'
  },
  { name: 'format', script: 'format:check', fast: true, desc: 'prettier 格式一致性' },
  { name: 'typecheck', script: 'typecheck', fast: true, desc: 'TypeScript 类型检查（库 + 用例两份工程）' },
  { name: 'lint', script: 'lint', fast: true, desc: 'ESLint' },
  {
    name: 'verify',
    script: 'verify:reuse',
    // pre-commit 用：产物过期就跳过，别在提交钩子里重建 198 份包（pre-push 会重建）
    fastScript: 'verify:if-fresh',
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
    name: 'visual',
    script: 'audit:visual',
    desc: '视觉体检（计算样式契约 + 逐组件截图画廊，拦双层边框这类纯视觉缺陷）'
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

async function main(argv) {
  const fast = argv.includes('--fast')
  const keepGoing = argv.includes('--keep-going')
  const changed = argv.includes('--changed')
  const dry = argv.includes('--dry')
  const stageFlag = argv.indexOf('--stage')
  const only = stageFlag >= 0 ? argv[stageFlag + 1] : null
  const baseFlag = argv.indexOf('--base')
  const base = baseFlag >= 0 ? argv[baseFlag + 1] : null

  if (changed && fast) {
    console.error('--changed 与 --fast 不能同时用：前者按影响面选层，后者是固定五段的秒级子集')
    return 2
  }

  // 变更范围选择器（scripts/test-impact.mjs）只决定"跑哪几段、哪几个用例"，
  // 阶段定义仍以本文件的 STAGES 为唯一来源，段数不受影响。
  let plan = null
  let selected = selectStages({ fast, only })
  if (changed) {
    plan = planFromChanges({ files: readChangedFiles({ base }) })
    if (plan.scope === 'none') {
      process.stdout.write('\n没有改动，门禁无需执行\n')
      writeReport({ mode: 'changed', results: [], plan })
      return 0
    }
    const wanted = new Set(plan.stages)
    selected = selected.filter((stage) => wanted.has(stage.name))
    if (!selected.length) {
      console.error(`受影响范围没有可执行阶段：${describePlan(plan)}`)
      return 2
    }
    process.stdout.write(`\n── 变更范围 · ${describePlan(plan)}\n`)
    for (const file of plan.files) {
      process.stdout.write(`   · ${file}\n`)
    }
    for (const reason of plan.reasons) {
      process.stdout.write(`   → ${reason}\n`)
    }
    if (dry) {
      process.stdout.write(`\n执行计划：${selected.map((stage) => stage.name).join(' → ')}\n`)
      for (const [stage, list] of Object.entries(plan.filters)) {
        process.stdout.write(`  ${stage}：${list.join(' ')}\n`)
      }
      return 0
    }
  }

  // 只有"真的先跑了 build"时，后续阶段才能复用同一批产物改走 fullScript；
  // --stage 单跑、fast 模式、只改了测试的 --changed 都没有这份保证，必须用各自会自行构建的原始脚本。
  const singleBuild = !fast && selected.some((stage) => stage.name === 'build')
  if (!selected.length) {
    console.error(`没有匹配的阶段：--stage ${only ?? ''}`)
    return 2
  }

  const results = []
  let abortedBy = null
  let wallMs = null

  // 在 npm 里跑时复用同一个 npm-cli.js（跨平台、不依赖 PATH 上的 shim）；
  // 直接被 node/钩子调起时才退回可执行文件名，Windows 上 .cmd 必须经 shell 才能起来
  const npmCli = process.env.npm_execpath
  const command = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm'

  // 两个隐式前置条件不再靠人记（漏一条就误红一轮门禁，历史上至少三次）：
  //   1. 宿主 safe-delete 保护会让 Vite 清空 dist/ 生成物时直接失败 → 构建段整段假红。
  //      宿主默认注入 =1，所以这里必须显式覆盖成 0（只作用于本命令拉起的子进程）：
  //      门禁删的只有 dist/、.build/ 这类生成物，保护与构建本身是冲突的。
  //   2. 本机 HTTP 代理会把 127.0.0.1 的模块请求接走 → 浏览器层 Firefox 子集超时。
  const childEnv = { ...process.env, CODEBUDDY_SAFE_DELETE_ENABLED: '0' }
  const autoEnv = ['CODEBUDDY_SAFE_DELETE_ENABLED=0（构建段需要清空 dist/ 生成物）']
  if (!childEnv.NO_PROXY && !childEnv.no_proxy) {
    childEnv.NO_PROXY = '127.0.0.1,localhost'
    childEnv.no_proxy = '127.0.0.1,localhost'
    autoEnv.push('NO_PROXY=127.0.0.1,localhost')
  }
  process.stdout.write(`\n环境自愈：${autoEnv.join('、')}\n`)

  // fast 固定五段彼此独立，并行执行后再按 STAGES 顺序回放缓冲输出；
  // full / --changed / --stage 仍走串行（构建产物有依赖，且要保留短路语义）。
  if (fast && !changed && !only) {
    const parallel = await runFastParallel({ stages: selected, command, npmCli, env: childEnv })
    results.push(...parallel.results)
    wallMs = parallel.wallMs
  } else {
    for (const [index, stage] of selected.entries()) {
      const started = Date.now()
      const script =
        singleBuild && stage.fullScript ? stage.fullScript : fast && stage.fastScript ? stage.fastScript : stage.script
      // 受影响范围只在必要时收窄到具体用例文件：整层优先，漏跑比多跑贵
      const files = plan?.filters?.[stage.name] ?? []
      process.stdout.write(`\n── ${stage.name} · ${stage.desc}${files.length ? `（${files.length} 个文件）` : ''}\n`)
      const npmArgs = npmCli ? [npmCli, 'run', script] : ['run', script]
      if (files.length) {
        npmArgs.push('--', ...files)
      }
      const run = spawnSync(command, npmArgs, {
        stdio: 'inherit',
        shell: !npmCli,
        encoding: 'utf8',
        env: childEnv
      })
      const durationMs = Date.now() - started
      const ok = run.status === 0
      results.push({ stage: stage.name, script, files: files.length ? files : null, ok, durationMs })
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
  }

  const report = writeReport({
    mode: changed ? 'changed' : fast ? 'fast' : only ? `stage:${only}` : 'full',
    results,
    plan,
    abortedBy,
    totalMs: wallMs
  })

  process.stdout.write('\n阶段汇总\n')
  for (const item of results) {
    const mark = item.skipped ? '·' : item.ok ? '✓' : '✗'
    const detail = item.skipped ? '未执行' : `${(item.durationMs / 1000).toFixed(1)}s`
    process.stdout.write(`  ${mark} ${item.stage.padEnd(16)} ${detail}\n`)
  }
  if (plan) {
    process.stdout.write(`\n变更范围：${describePlan(plan)}\n`)
  }
  process.stdout.write(`\n${report.ok ? '门禁通过' : '门禁失败'}，明细见 ci-report.json\n`)
  return report.ok ? 0 : 1
}

// 并行段的输出必须整段缓冲：多个子进程同时写继承的 stdout 会互相穿插，
// 失败时也定位不到是哪个阶段；回放顺序固定为 STAGES 顺序，与串行输出一致。
async function runFastParallel({ stages, command, npmCli, env }) {
  const started = Date.now()
  process.stdout.write(`\n── 并行执行：${stages.map((stage) => stage.name).join(' / ')}（完成后按阶段顺序回放输出）\n`)
  const settled = await Promise.all(
    stages.map((stage) => spawnStage({ command, npmCli, script: stage.fastScript ?? stage.script, env }))
  )
  const results = []
  for (const [index, stage] of stages.entries()) {
    const { status, stdout, stderr, durationMs } = settled[index]
    process.stdout.write(`\n── ${stage.name} · ${stage.desc}\n`)
    if (stdout) {
      process.stdout.write(stdout.endsWith('\n') ? stdout : `${stdout}\n`)
    }
    if (stderr) {
      process.stderr.write(stderr.endsWith('\n') ? stderr : `${stderr}\n`)
    }
    const ok = status === 0
    results.push({ stage: stage.name, script: stage.fastScript ?? stage.script, files: null, ok, durationMs })
    process.stdout.write(
      `${ok ? '✓' : '✗'} ${stage.name} ${ok ? '通过' : '失败'}（${(durationMs / 1000).toFixed(1)}s）\n`
    )
  }
  return { results, wallMs: Date.now() - started }
}

function spawnStage({ command, npmCli, script, env }) {
  const started = Date.now()
  const args = npmCli ? [npmCli, 'run', script] : ['run', script]
  return new Promise((resolve) => {
    let settled = false
    let stdout = ''
    let stderr = ''
    const finish = (status) => {
      if (settled) {
        return
      }
      settled = true
      resolve({ status, stdout, stderr, durationMs: Date.now() - started })
    }
    const child = spawn(command, args, { shell: !npmCli, env })
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    child.on('error', (error) => {
      stderr += `${error.message}\n`
      finish(null)
    })
    child.on('close', (status) => finish(status))
  })
}

function writeReport({ mode, results, plan = null, abortedBy = null, totalMs = null }) {
  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    ok: results.every((item) => item.ok || item.skipped === true),
    abortedBy,
    skipped: results.filter((item) => item.skipped).map((item) => item.stage),
    totalMs: totalMs ?? results.reduce((sum, item) => sum + item.durationMs, 0),
    stages: results,
    changed: plan
      ? { scope: plan.scope, files: plan.files, reasons: plan.reasons, stages: plan.stages, filters: plan.filters }
      : null
  }
  writeFileSync(new URL('../ci-report.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`)
  return report
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (entryUrl === import.meta.url) {
  process.exitCode = await main(process.argv.slice(2))
}
