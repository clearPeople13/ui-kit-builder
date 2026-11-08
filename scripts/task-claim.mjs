#!/usr/bin/env node
/**
 * 任务认领台账（并行 worktree 治理）
 *
 * 问题：多个 agent / 开发者在各自的 git worktree 里并行改同一份仓库，
 * 没有中央记录时，两个任务改到同一个文件、或把派生产物（dist/、sizes.json…）
 * 当成源码提交，要到整合阶段才爆出来。
 *
 * 做法：以"相对仓库根的路径前缀"为所有权单位，维护两份台账：
 *   - .tasks/active.json   当前活跃认领（version + tasks[id]{...}）
 *   - .tasks/history.jsonl 追加式事件流（claim / status / release / gc）
 * 认领前用 check 干跑重叠校验；重叠判定按路径边界（a/ 与 a/b.ts 相交，
 * a/ 与 ab/ 不相交）。派生产物（构建/报告输出）一律不可 own，
 * verify-branch 在整合前再拦一次"分支 diff 里混入派生产物"。
 *
 * 所有核心函数接受 options.root（默认取脚本所在仓库根），CLI 支持 --root 覆盖，
 * 便于用临时目录测试。只用 node 内置模块。
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const DEFAULT_ROOT = path.resolve(fileURLToPath(new URL('../', import.meta.url)))

const LEDGER_VERSION = 1
const ACTIVE_FILE = path.join('.tasks', 'active.json')
const HISTORY_FILE = path.join('.tasks', 'history.jsonl')
const DEFAULT_TTL_MINUTES = 180

/** 合法状态机取值 */
export const STATUSES = ['running', 'integrating', 'done', 'aborted']

/**
 * 派生产物：构建 / 报告输出，不可 own，verify-branch 也拒绝它们出现在分支 diff 里。
 * 目录以 / 结尾（前缀匹配），文件按精确路径边界匹配。
 */
export const DERIVED_ARTIFACTS = [
  'sizes.json',
  'examples/consumer/src/demo/meta.json',
  'ci-report.json',
  'coverage/',
  'dist/',
  '.build/'
]

/** 路径标准化：去开头 ./ 与多余斜杠 */
export function normalizePath(p) {
  return String(p)
    .replace(/^\.\//, '')
    .replace(/\/{2,}/g, '/')
}

/** 是否为目录前缀（以 / 结尾） */
export function isDirPrefix(p) {
  return p.endsWith('/')
}

/**
 * 路径边界上的前缀相交判定：
 *   a/ 与 a/b.ts 相交；a/ 与 ab/ 不相交；a.ts 与 a.ts 相交；a.ts 与 a/ 不相交。
 */
export function pathsOverlap(a, b) {
  const x = normalizePath(a)
  const y = normalizePath(b)
  if (x === y) {
    return true
  }
  // 双向判定：目录前缀可以互为父子（dist/sub/ 与 dist/ 相交），文件只在相等时相交
  if (isDirPrefix(x) && y.startsWith(x)) {
    return true
  }
  if (isDirPrefix(y) && x.startsWith(y)) {
    return true
  }
  return false
}

/** own 是否命中派生产物（复用同一边界判定，dist/sub/ 也算命中 dist/） */
export function hitsDerivedArtifact(own) {
  return DERIVED_ARTIFACTS.some((artifact) => pathsOverlap(own, artifact))
}

/** 台账目录与文件路径 */
function ledgerPaths(root) {
  return {
    dir: path.join(root, '.tasks'),
    active: path.join(root, ACTIVE_FILE),
    history: path.join(root, HISTORY_FILE)
  }
}

/** 读取 active.json；不存在时返回空台账 */
export function readLedger(root) {
  const { active } = ledgerPaths(root)
  if (!existsSync(active)) {
    return { version: LEDGER_VERSION, tasks: {} }
  }
  const data = JSON.parse(readFileSync(active, 'utf8'))
  return { version: data.version ?? LEDGER_VERSION, tasks: data.tasks ?? {} }
}

/** 写回 active.json（原子写：先写临时文件再 rename，避免并发读到半截 JSON） */
function writeLedger(root, ledger) {
  const { dir, active } = ledgerPaths(root)
  mkdirSync(dir, { recursive: true })
  const tmp = `${active}.${process.pid}.tmp`
  writeFileSync(tmp, `${JSON.stringify(ledger, null, 2)}\n`)
  renameSync(tmp, active)
}

/** 追加 history.jsonl 事件 */
function appendHistory(root, event) {
  const { dir, history } = ledgerPaths(root)
  mkdirSync(dir, { recursive: true })
  appendFileSync(history, `${JSON.stringify({ ts: new Date().toISOString(), ...event })}\n`)
}

/** 校验 owns 列表：非空、无重复、不命中派生产物 */
export function validateOwns(owns) {
  const list = (owns ?? []).map(normalizePath).filter(Boolean)
  if (!list.length) {
    return { ok: false, error: '--owns 至少需要一个路径前缀' }
  }
  for (const own of list) {
    if (hitsDerivedArtifact(own)) {
      return { ok: false, error: `owns 命中派生产物，不允许认领：${own}` }
    }
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (pathsOverlap(list[i], list[j])) {
        return { ok: false, error: `owns 内部自相重叠：${list[i]} 与 ${list[j]}` }
      }
    }
  }
  return { ok: true, owns: list }
}

/** 找出一个 owns 列表与某个任务 owns 的所有相交路径 */
function intersectOwns(owns, otherOwns) {
  const hit = []
  for (const a of owns) {
    for (const b of otherOwns) {
      if (pathsOverlap(a, b)) {
        hit.push(`${a} ∩ ${b}`)
      }
    }
  }
  return hit
}

/**
 * 干跑重叠校验：给定 owns（可排除某个 taskId，供 claim 时忽略自身），
 * 返回冲突列表 [{ id, owner, intersect }]；空数组 = 无重叠。
 */
export function checkOverlap(options) {
  const root = options.root ?? DEFAULT_ROOT
  const validated = validateOwns(options.owns)
  if (!validated.ok) {
    return { ok: false, error: validated.error, conflicts: [] }
  }
  const ledger = readLedger(root)
  const conflicts = []
  for (const [id, task] of Object.entries(ledger.tasks)) {
    if (id === options.excludeId) {
      continue
    }
    const intersect = intersectOwns(validated.owns, task.owns ?? [])
    if (intersect.length) {
      conflicts.push({ id, owner: task.owner, intersect })
    }
  }
  return { ok: conflicts.length === 0, conflicts, owns: validated.owns }
}

// git 子进程必须剥掉钩子注入的 GIT_*：pre-push 上下文 GIT_DIR 指向真实仓库，-C 指定的临时目录会被当成那个仓库（F-115）
function gitEnv() {
  const env = { ...process.env }
  for (const key of [
    'GIT_DIR',
    'GIT_WORK_TREE',
    'GIT_INDEX_FILE',
    'GIT_OBJECT_DIRECTORY',
    'GIT_ALTERNATE_OBJECT_DIRECTORIES'
  ]) {
    delete env[key]
  }
  return env
}

/** 取当前 HEAD（不在 git 仓库时返回 null，不阻塞临时目录场景） */
function resolveBaseCommit(root) {
  try {
    return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      env: gitEnv()
    }).trim()
  } catch {
    return null
  }
}

/**
 * 认领任务：校验（owns 合法 + 无重叠 + id 未占用）后写台账。
 * 返回 { ok, task? }；失败时 error 说明原因。options.now 可注入时间戳（测试用）。
 */
export function claim(options) {
  const root = options.root ?? DEFAULT_ROOT
  const id = String(options.id ?? '').trim()
  if (!id) {
    return { ok: false, error: '--id 不能为空' }
  }
  const owner = String(options.owner ?? '').trim()
  if (!owner) {
    return { ok: false, error: '--owner 不能为空' }
  }
  const branch = String(options.branch ?? '').trim()
  if (!branch) {
    return { ok: false, error: '--branch 不能为空' }
  }

  const ledger = readLedger(root)
  if (ledger.tasks[id]) {
    return { ok: false, error: `任务 id 已存在：${id}（owner=${ledger.tasks[id].owner}）` }
  }
  const check = checkOverlap({ root, owns: options.owns })
  if (!check.ok) {
    if (check.error) {
      return { ok: false, error: check.error }
    }
    const detail = check.conflicts.map((c) => `${c.id}(${c.owner}): ${c.intersect.join(', ')}`).join('；')
    return { ok: false, error: `所有权重叠：${detail}`, conflicts: check.conflicts }
  }

  const ttlMinutes = Number(options.ttl ?? DEFAULT_TTL_MINUTES)
  if (!Number.isFinite(ttlMinutes) || ttlMinutes <= 0) {
    return { ok: false, error: `--ttl 必须是正整数分钟数，收到：${options.ttl}` }
  }

  const task = {
    owner,
    branch,
    worktree: options.worktree ? normalizePath(options.worktree) : null,
    owns: check.owns,
    status: 'running',
    baseCommit: options.base ?? resolveBaseCommit(root),
    claimedAt: options.claimedAt ?? options.now ?? Date.now(),
    ttlMinutes
  }
  ledger.tasks[id] = task
  writeLedger(root, ledger)
  appendHistory(root, { event: 'claim', id, owner, branch, owns: task.owns })
  return { ok: true, task: { id, ...task } }
}

/** 迁移状态并追加 history；状态值必须在 STATUSES 内 */
export function setStatus(options) {
  const root = options.root ?? DEFAULT_ROOT
  const ledger = readLedger(root)
  const task = ledger.tasks[options.id]
  if (!task) {
    return { ok: false, error: `任务不存在：${options.id}` }
  }
  if (!STATUSES.includes(options.status)) {
    return { ok: false, error: `--set 必须是 ${STATUSES.join('|')} 之一，收到：${options.status}` }
  }
  const from = task.status
  task.status = options.status
  writeLedger(root, ledger)
  appendHistory(root, { event: 'status', id: options.id, from, to: options.status })
  return { ok: true, task: { id: options.id, ...task } }
}

/** 归档：追加 release 事件后从 active 移除 */
export function release(options) {
  const root = options.root ?? DEFAULT_ROOT
  const status = options.status ?? 'done'
  if (!STATUSES.includes(status)) {
    return { ok: false, error: `--status 必须是 ${STATUSES.join('|')} 之一，收到：${status}` }
  }
  const ledger = readLedger(root)
  const task = ledger.tasks[options.id]
  if (!task) {
    return { ok: false, error: `任务不存在：${options.id}` }
  }
  delete ledger.tasks[options.id]
  writeLedger(root, ledger)
  appendHistory(root, { event: 'release', id: options.id, status, owner: task.owner, branch: task.branch })
  return { ok: true, task: { id: options.id, ...task, status } }
}

/**
 * TTL 回收：过期（now > claimedAt + ttlMinutes）的任务——
 *   worktree 干净（git status --porcelain 为空，或无 worktree）→ release；
 *   worktree 有未提交改动 → 置 aborted 但保留在 active（等人工处理，避免丢工作）。
 * 返回 { released: [...], kept: [...] }。
 */
export function gc(options = {}) {
  const root = options.root ?? DEFAULT_ROOT
  const now = options.now ?? Date.now()
  const ledger = readLedger(root)
  const released = []
  const kept = []
  for (const [id, task] of Object.entries(ledger.tasks)) {
    const expiresAt = task.claimedAt + task.ttlMinutes * 60_000
    if (now <= expiresAt) {
      continue
    }
    const clean = isWorktreeClean(root, task)
    if (clean) {
      delete ledger.tasks[id]
      released.push(id)
      appendHistory(root, {
        event: 'release',
        id,
        status: 'aborted',
        via: 'gc',
        reason: 'ttl-expired',
        owner: task.owner
      })
    } else {
      const from = task.status
      task.status = 'aborted'
      kept.push(id)
      appendHistory(root, {
        event: 'status',
        id,
        from,
        to: 'aborted',
        via: 'gc',
        reason: 'ttl-expired-dirty-worktree',
        owner: task.owner
      })
    }
  }
  writeLedger(root, ledger)
  return { released, kept }
}

/** worktree 是否干净：无 worktree 视为干净（无可检查的工作区，直接回收） */
function isWorktreeClean(root, task) {
  if (!task.worktree) {
    return true
  }
  const dir = path.isAbsolute(task.worktree) ? task.worktree : path.join(root, task.worktree)
  if (!existsSync(dir)) {
    return true
  }
  try {
    const out = execFileSync('git', ['-C', dir, 'status', '--porcelain'], { encoding: 'utf8', env: gitEnv() })
    return out.trim() === ''
  } catch {
    // 不是 git 仓库：无法用 git 判定，保守视为不干净，保留任务
    return false
  }
}

/** 分支 diff 是否混入派生产物：git diff --name-only <base>...HEAD 逐条边界匹配 */
export function verifyBranch(options) {
  const root = options.root ?? DEFAULT_ROOT
  const ledger = readLedger(root)
  const task = ledger.tasks[options.id]
  if (!task) {
    return { ok: false, error: `任务不存在：${options.id}` }
  }
  if (!task.baseCommit) {
    return { ok: false, error: `任务 ${options.id} 没有 baseCommit，无法判定 diff` }
  }
  const cwd = task.worktree && path.isAbsolute(task.worktree) ? task.worktree : root
  let files
  try {
    files = execFileSync('git', ['-C', cwd, 'diff', '--name-only', `${task.baseCommit}...HEAD`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: gitEnv()
    })
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
  } catch (err) {
    return { ok: false, error: `git diff 失败：${String(err.message).trim()}` }
  }
  const violations = files.filter((f) => DERIVED_ARTIFACTS.some((a) => pathsOverlap(f, a)))
  return { ok: violations.length === 0, files, violations }
}

/** 列出活跃任务 */
export function listTasks(options = {}) {
  const root = options.root ?? DEFAULT_ROOT
  return readLedger(root).tasks
}

const USAGE = `用法：node scripts/task-claim.mjs <command> [options]

命令：
  check --owns <p1,p2,...>
      干跑重叠校验，不写台账。退出 0=无重叠，1=相交（打印冲突任务 id 与相交路径）。
  claim --id <id> --owner <o> --branch <b> --owns <p,...>
        [--worktree <p>] [--ttl 180] [--base <commit>]
      校验后写台账。退出 1=所有权重叠或 id 已存在。
  status --id <id> --set <running|integrating|done|aborted>
      迁移状态并追加 history。
  release --id <id> [--status done|aborted]
      归档到 history，从 active 移除。
  list [--json]
      列出活跃任务。
  gc
      TTL 回收：过期且 worktree 干净的任务 release；过期但 worktree 有改动则 aborted 并保留。
  verify-branch --id <id>
      git diff --name-only <base>...HEAD，分支 diff 混入派生产物则退出 1。

通用：
  --root <path>   覆盖台账根目录（默认取脚本所在仓库根），便于用临时目录测试。
  --help          显示本说明。

所有权规则：相对仓库根的路径前缀，目录以 / 结尾。重叠=互为前缀且按路径边界
判定（a/ 与 a/b.ts 相交，a/ 与 ab/ 不相交）。派生产物（sizes.json、
examples/consumer/src/demo/meta.json、ci-report.json、coverage/、dist/、.build/）不可 own。`

/** 极简 argv 解析：--key value 与 --flag 两种形态 */
function parseArgv(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      out._.push(arg)
      continue
    }
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) {
      out[key] = true
    } else {
      out[key] = next
      i++
    }
  }
  return out
}

/** 逗号分隔的 owns 转数组 */
function ownsFrom(value) {
  if (Array.isArray(value)) {
    return value
  }
  return String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** CLI 入口：返回进程退出码（0/1），便于测试；直接运行时用 process.exit 落盘。 */
export function run(argv) {
  const args = parseArgv(argv)
  const root = typeof args.root === 'string' ? path.resolve(args.root) : DEFAULT_ROOT
  const command = args._[0]

  if (!command || args.help || command === 'help') {
    console.log(USAGE)
    return command || args.help ? 0 : 1
  }

  switch (command) {
    case 'check': {
      const result = checkOverlap({ root, owns: ownsFrom(args.owns) })
      if (result.error) {
        console.error(`check 失败：${result.error}`)
        return 1
      }
      if (!result.ok) {
        for (const c of result.conflicts) {
          console.error(`冲突：${c.id}（${c.owner}）相交路径：${c.intersect.join('，')}`)
        }
        return 1
      }
      console.log('无重叠')
      return 0
    }
    case 'claim': {
      const result = claim({
        root,
        id: args.id,
        owner: args.owner,
        branch: args.branch,
        owns: ownsFrom(args.owns),
        worktree: typeof args.worktree === 'string' ? args.worktree : null,
        ttl: args.ttl === true ? undefined : args.ttl,
        base: typeof args.base === 'string' ? args.base : undefined
      })
      if (!result.ok) {
        console.error(`claim 失败：${result.error}`)
        return 1
      }
      console.log(
        `已认领：${result.task.id}（${result.task.owner} @ ${result.task.branch}）owns=${result.task.owns.join(' ')}`
      )
      return 0
    }
    case 'status': {
      const result = setStatus({ root, id: args.id, status: args.set })
      if (!result.ok) {
        console.error(`status 失败：${result.error}`)
        return 1
      }
      console.log(`${result.task.id}: ${result.task.status}`)
      return 0
    }
    case 'release': {
      const result = release({ root, id: args.id, status: typeof args.status === 'string' ? args.status : 'done' })
      if (!result.ok) {
        console.error(`release 失败：${result.error}`)
        return 1
      }
      console.log(`已归档：${result.task.id}（status=${result.task.status}）`)
      return 0
    }
    case 'list': {
      const tasks = listTasks({ root })
      if (args.json) {
        console.log(JSON.stringify(tasks, null, 2))
      } else if (Object.keys(tasks).length === 0) {
        console.log('（无活跃任务）')
      } else {
        for (const [id, task] of Object.entries(tasks)) {
          console.log(`${id}  ${task.status}  ${task.owner}  ${task.branch}  owns=${task.owns.join(' ')}`)
        }
      }
      return 0
    }
    case 'gc': {
      const result = gc({ root })
      console.log(
        `gc：回收 ${result.released.length} 个（${result.released.join(' ') || '无'}），保留 ${result.kept.length} 个（${result.kept.join(' ') || '无'}）`
      )
      return 0
    }
    case 'verify-branch': {
      const result = verifyBranch({ root, id: args.id })
      if (result.error) {
        console.error(`verify-branch 失败：${result.error}`)
        return 1
      }
      if (!result.ok) {
        console.error(`分支 diff 混入派生产物：`)
        for (const v of result.violations) {
          console.error(`  - ${v}`)
        }
        return 1
      }
      console.log(`分支 diff 干净（${result.files.length} 个改动文件，无派生产物）`)
      return 0
    }
    default:
      console.error(`未知命令：${command}\n\n${USAGE}`)
      return 1
  }
}

// 直接运行（非被 import）时以进程退出码收尾
const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (entryUrl === import.meta.url) {
  process.exit(run(process.argv.slice(2)))
}
