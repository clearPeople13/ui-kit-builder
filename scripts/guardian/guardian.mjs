#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { loadDetectors } from './detectors.mjs'

const DEFAULTS = {
  dir: process.cwd(),
  interval: 15,
  debounce: 45,
  heartbeat: 3600,
  cooldown: 1800,
  maxAttempts: 2,
  checkTimeout: 600,
  fixTimeout: 1200,
  checkCmd: 'npm run verify:consumer',
  fixCmd: '',
  issues: '.guardian/issues.jsonl',
  branchPrefix: 'guardian',
  detectors: 'verify,sweep',
  once: false
}

const FLAG_MAP = {
  '--dir': 'dir',
  '--interval': ['interval', Number],
  '--debounce': ['debounce', Number],
  '--heartbeat': ['heartbeat', Number],
  '--cooldown': ['cooldown', Number],
  '--max-attempts': ['maxAttempts', Number],
  '--check-timeout': ['checkTimeout', Number],
  '--fix-timeout': ['fixTimeout', Number],
  '--check-cmd': 'checkCmd',
  '--fix-cmd': 'fixCmd',
  '--issues': 'issues',
  '--branch-prefix': 'branchPrefix',
  '--detectors': 'detectors',
  '--once': ['once', Boolean]
}

function parseArgs(argv) {
  const options = { ...DEFAULTS }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = FLAG_MAP[argv[index]]
    if (!flag) {
      continue
    }
    if (Array.isArray(flag) && flag[1] === Boolean) {
      options[flag[0]] = true
      continue
    }
    const key = Array.isArray(flag) ? flag[0] : flag
    const coerce = Array.isArray(flag) ? flag[1] : String
    options[key] = coerce(argv[index + 1])
    index += 1
  }
  options.issues = resolve(options.dir, options.issues)
  return options
}

function usage() {
  console.log(`guardian — 常驻自检守护循环（本地分支，不推送）

用法: node scripts/guardian/guardian.mjs [flags]

  --dir <path>            仓库根目录（默认 cwd）
  --interval <s>          变更轮询间隔（默认 15）
  --debounce <s>          变更后静默期再检测（默认 45）
  --heartbeat <s>         空闲心跳强制全检（默认 3600，0 关闭）
  --cooldown <s>          同一问题修复冷却（默认 1800）
  --max-attempts <n>      同一问题最多修复尝试（默认 2）
  --check-cmd <cmd>       检测命令（默认 "npm run verify:consumer"）
  --fix-cmd <cmd>         修复命令模板，可用 {summary} {logfile} 占位；
                          留空则调用 opencode run（未安装时只记录 issue 不修复）
  --issues <file>         issue 存储（默认 .guardian/issues.jsonl）
  --branch-prefix <p>     修复分支前缀（默认 guardian）
  --detectors <id,...>    启用的探针：verify / sweep（默认 verify,sweep）
  --once                  只跑一轮（调试用）
  --check-timeout <s>     检测超时（默认 600）
  --fix-timeout <s>       修复超时（默认 1200）`)
}

function stamp() {
  return new Date().toISOString()
}

function log(message) {
  console.log(`[${stamp()}] ${message}`)
}

function run(command, args, options) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: options.shell ?? false,
      timeout: options.timeout * 1000,
      windowsHide: true
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('close', (code) => {
      resolvePromise({ code: code ?? -1, stdout, stderr })
    })
    child.on('error', (error) => {
      resolvePromise({ code: -1, stdout, stderr: String(error) })
    })
  })
}

function shellQuote(value) {
  return `"${value.replaceAll('"', '\\"')}"`
}

let shellScriptCounter = 0

function runShell(commandLine, cwd, timeout) {
  if (process.platform !== 'win32') {
    return run('sh', ['-c', commandLine], { cwd, timeout })
  }
  // cmd /s /c 会把引号原样塞进子进程 argv，带引号的命令会被破坏；
  // 经批文件中转后引号由 cmd 的批处理解析规则处理，行为与手工执行一致
  const guardianDir = join(cwd, '.guardian')
  mkdirSync(guardianDir, { recursive: true })
  shellScriptCounter += 1
  const scriptFile = join(guardianDir, `run-${process.pid}-${shellScriptCounter}.cmd`)
  writeFileSync(scriptFile, `@echo off\r\n${commandLine}\r\n`)
  return run('cmd.exe', ['/d', '/s', '/c', scriptFile], { cwd, timeout }).finally(() => {
    rmSync(scriptFile, { force: true })
  })
}

function git(options, args) {
  return run('git', args, { cwd: options.dir, timeout: 120 })
}

async function worktreeHash(options) {
  const head = await git(options, ['rev-parse', 'HEAD'])
  const status = await git(options, ['status', '--porcelain', '--', '.', ':(exclude).guardian', ':(exclude).opencode'])
  return createHash('sha1')
    .update(head.stdout.trim() + status.stdout)
    .digest('hex')
    .slice(0, 12)
}

async function worktreeDirty(options) {
  const status = await git(options, ['status', '--porcelain', '--', '.', ':(exclude).guardian', ':(exclude).opencode'])
  return status.stdout.trim().length > 0
}

function failureLines(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /error|failed|失败|不通过|✗|TS\d{4}/i.test(line))
}

function fingerprintOf(output, code) {
  const lines = failureLines(output).slice(0, 8)
  const source = lines.length ? lines.join('\n') : `exit-code-${code}`
  return createHash('sha1').update(source).digest('hex').slice(0, 10)
}

function summaryOf(output, code) {
  const first = failureLines(output)[0]
  if (!first) {
    return `检测命令退出码 ${code}`
  }
  return first.length > 120 ? `${first.slice(0, 117)}...` : first
}

function loadIssues(file) {
  const issues = new Map()
  if (!existsSync(file)) {
    return issues
  }
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) {
      continue
    }
    try {
      const issue = JSON.parse(line)
      issues.set(issue.fingerprint, issue)
    } catch {
      // 跳过损坏行
    }
  }
  return issues
}

function saveIssue(options, issue) {
  mkdirSync(dirname(options.issues), { recursive: true })
  appendFileSync(options.issues, `${JSON.stringify(issue)}\n`)
  renderIssuesMarkdown(options)
}

function renderIssuesMarkdown(options) {
  const issues = [...loadIssues(options.issues).values()].sort((a, b) => {
    return b.lastSeen.localeCompare(a.lastSeen)
  })
  const lines = ['# Guardian Issues', '']
  if (!issues.length) {
    lines.push('暂无 issue。')
  }
  for (const issue of issues) {
    lines.push(`## ${issue.id} [${issue.status}]`)
    lines.push(`- 探针: ${issue.detector ?? 'verify'}（${issue.kind ?? 'blocking'}）`)
    lines.push(`- 摘要: ${issue.summary}`)
    lines.push(`- 首次发现: ${issue.firstSeen}`)
    lines.push(`- 最近出现: ${issue.lastSeen}（累计 ${issue.count} 次）`)
    lines.push(`- 修复尝试: ${issue.attempts}/${issue.maxAttempts}`)
    if (issue.branch) {
      lines.push(`- 修复分支: ${issue.branch}`)
    }
    lines.push('')
  }
  writeFileSync(join(dirname(options.issues), 'issues.md'), lines.join('\n'))
}

function hasOpencode() {
  const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['opencode'], {
    shell: process.platform === 'win32',
    windowsHide: true
  })
  return probe.status === 0
}

function buildFixInvocation(options, issue, logFile) {
  if (options.fixCmd) {
    const commandLine = options.fixCmd
      .replaceAll('{summary}', shellQuote(issue.summary))
      .replaceAll('{logfile}', shellQuote(logFile))
    return { shell: true, commandLine }
  }
  const prompt = [
    '这个仓库的自检失败了，请修复。要求：最小改动；不要执行 git 提交、推送或分支操作；除非确有必要不要改 package-lock.json。',
    `失败摘要：${issue.summary}`,
    `完整失败日志在 ${logFile}，先读它再动手。`,
    `修复后必须保证 \`${options.checkCmd}\` 退出码为 0。`
  ].join('\n')
  return { shell: false, command: 'opencode', args: ['run', prompt] }
}

async function switchBack(options, base) {
  const target = base === 'HEAD' ? '--detach' : base
  const switched = await git(options, ['switch', target])
  if (switched.code !== 0) {
    // 修复尝试只产生它自己的改动，丢弃是安全的
    await git(options, ['switch', '-f', target])
  }
}

async function attemptFix(options, issue) {
  if (await worktreeDirty(options)) {
    log('工作区有未提交改动，跳过自动修复（issue 已记录，留人工）')
    return { fixed: false, skipped: true }
  }
  const base = (await git(options, ['branch', '--show-current'])).stdout.trim() || 'HEAD'
  const branch = `${options.branchPrefix}/${issue.id}-a${issue.attempts + 1}`
  const created = await git(options, ['switch', '-c', branch])
  if (created.code !== 0) {
    log(`创建修复分支失败: ${created.stderr.trim()}`)
    return { fixed: false, skipped: true }
  }
  log(`已创建修复分支 ${branch}，开始修复`)
  const guardianDir = join(options.dir, '.guardian')
  const logFile = join(guardianDir, 'last-failure.log')
  writeFileSync(logFile, issue.lastOutput)
  const invocation = buildFixInvocation(options, issue, logFile)
  const fixResult = invocation.shell
    ? await runShell(invocation.commandLine, options.dir, options.fixTimeout)
    : await run(invocation.command, invocation.args, { cwd: options.dir, timeout: options.fixTimeout })
  log(`修复命令退出码 ${fixResult.code}，复跑检测`)
  const recheckResult = await runShell(options.checkCmd, options.dir, options.checkTimeout)
  const recheck = { ok: recheckResult.code === 0 }
  if (!(await worktreeDirty(options))) {
    await switchBack(options, base)
    await git(options, ['branch', '-D', branch])
    return { fixed: false, skipped: false, note: '修复未产生改动' }
  }
  await git(options, ['add', '-A', '--', '.', ':(exclude).guardian', ':(exclude).opencode'])
  const message = recheck.ok ? `guardian: 修复 ${issue.id}` : `guardian: 修复尝试（未通过） ${issue.id}`
  const committed = await git(options, ['commit', '-m', message])
  await switchBack(options, base)
  if (committed.code !== 0) {
    await git(options, ['branch', '-D', branch])
    return { fixed: false, skipped: false, note: '提交失败' }
  }
  return { fixed: recheck.ok, skipped: false, branch, recheckOutput: recheck.output }
}

async function handleFailure(options, issues, detector, failure) {
  const scoped = `${detector.id}:${fingerprintOf(failure.output, 1)}`
  const fingerprint = createHash('sha1').update(scoped).digest('hex').slice(0, 10)
  const now = stamp()
  const existing = issues.get(fingerprint)
  const summary = failure.summary || summaryOf(failure.output, 1)
  const issue = existing ?? {
    id: `g-${fingerprint.slice(0, 6)}`,
    fingerprint,
    detector: detector.id,
    kind: detector.kind,
    summary,
    status: 'open',
    firstSeen: now,
    count: 0,
    attempts: 0,
    maxAttempts: options.maxAttempts,
    branch: '',
    lastOutput: ''
  }
  issue.summary = summary
  issue.lastSeen = now
  issue.count += 1
  issue.lastOutput = failure.output.slice(-8000)
  const cooldownActive = issue.lastAttempt && Date.now() - Date.parse(issue.lastAttempt) < options.cooldown * 1000
  if (issue.attempts >= issue.maxAttempts || cooldownActive) {
    saveIssue(options, issue)
    log(`已知问题 ${issue.id}（${detector.id}，尝试 ${issue.attempts}/${issue.maxAttempts}），跳过`)
    return
  }
  if (detector.kind === 'advisory') {
    issue.status = 'open'
    saveIssue(options, issue)
    log(`issue ${issue.id}: ${detector.id} 发现新问题（advisory，只记录不自动修）`)
    return
  }
  saveIssue(options, issue)
  const result = await attemptFix(options, issue)
  if (result.skipped) {
    // 未真正执行修复（工作区脏等），不消耗尝试次数
    issue.lastSeen = stamp()
    saveIssue(options, issue)
    log(`issue ${issue.id}: 跳过修复`)
    return
  }
  issue.attempts += 1
  issue.lastAttempt = now
  if (result.fixed) {
    issue.status = 'fixed'
    issue.branch = result.branch ?? issue.branch
  } else {
    issue.status = issue.attempts >= issue.maxAttempts ? 'failed' : 'open'
    if (result.branch) {
      issue.branch = result.branch
    }
  }
  issue.lastSeen = stamp()
  saveIssue(options, issue)
  const outcome = result.fixed
    ? '已修复并提交到分支'
    : result.skipped
      ? '跳过修复'
      : `修复未通过（${result.note ?? '复跑仍失败'}）`
  log(`issue ${issue.id}: ${outcome}`)
}

async function pass(options, issues) {
  const ctx = { dir: options.dir, log, run, runShell, git }
  const detectors = loadDetectors(options)
  if (!detectors.length) {
    log(`没有匹配的探针（--detectors ${options.detectors}），本轮跳过`)
    return true
  }
  let allOk = true
  for (const detector of detectors) {
    log(`运行探针: ${detector.title}`)
    let result
    try {
      result = await detector.run(ctx)
    } catch (error) {
      result = {
        failures: [
          {
            key: 'probe-crash',
            summary: `探针 ${detector.id} 崩溃: ${error.message}`,
            output: String(error.stack || error)
          }
        ]
      }
    }
    if (!result.failures.length) {
      log(`探针 ${detector.id}: 通过`)
      continue
    }
    allOk = false
    for (const failure of result.failures) {
      await handleFailure(options, issues, detector, failure)
    }
  }
  return allOk
}

function pidAlive(pid) {
  if (!/^\d+$/.test(pid)) {
    return false
  }
  if (process.platform === 'win32') {
    const result = spawnSync('tasklist', ['/FI', `PID eq ${pid}`], { windowsHide: true })
    return String(result.stdout).includes(pid)
  }
  try {
    process.kill(Number(pid), 0)
    return true
  } catch {
    return false
  }
}

function acquireLock(options) {
  const lockFile = join(options.dir, '.guardian', 'run.lock')
  if (existsSync(lockFile)) {
    const pid = readFileSync(lockFile, 'utf8').trim()
    if (pidAlive(pid)) {
      return ''
    }
    log(`清理过期锁（pid ${pid} 已死）`)
  }
  mkdirSync(dirname(lockFile), { recursive: true })
  writeFileSync(lockFile, String(process.pid))
  return lockFile
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.includes('--help') || argv.includes('-h')) {
    usage()
    return
  }
  const options = parseArgs(argv)
  const issues = loadIssues(options.issues)
  const lockFile = acquireLock(options)
  if (!lockFile) {
    log('已有 guardian 实例在运行（.guardian/run.lock），退出')
    process.exit(1)
  }
  const cleanup = () => {
    rmSync(lockFile, { force: true })
  }
  process.on('SIGINT', () => {
    cleanup()
    process.exit(0)
  })
  process.on('exit', cleanup)

  if (!options.fixCmd && !hasOpencode()) {
    log('未找到 opencode 且未指定 --fix-cmd：将只检测并记录 issue，不自动修复')
  }

  if (options.once) {
    await pass(options, issues)
    return
  }

  let lastHash = await worktreeHash(options)
  let lastChange = 0
  let lastPass = 0
  let running = false
  log(`守护循环启动：轮询 ${options.interval}s，静默 ${options.debounce}s，心跳 ${options.heartbeat}s`)
  setInterval(async () => {
    if (running) {
      return
    }
    running = true
    try {
      const current = await worktreeHash(options)
      const now = Date.now()
      if (current !== lastHash) {
        lastHash = current
        lastChange = now
        return
      }
      const quiet = now - lastChange >= options.debounce * 1000
      const heartbeatDue = options.heartbeat > 0 && now - lastPass >= options.heartbeat * 1000
      if (!quiet && !heartbeatDue) {
        return
      }
      lastPass = now
      await pass(options, issues)
      // 消耗本次触发：树稳定后回到空闲，等下一次变更或心跳
      lastChange = Date.now()
    } catch (error) {
      log(`检测轮出错：${error}`)
    } finally {
      running = false
    }
  }, options.interval * 1000)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
