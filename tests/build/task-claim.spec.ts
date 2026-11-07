import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DERIVED_ARTIFACTS,
  checkOverlap,
  claim,
  gc,
  hitsDerivedArtifact,
  listTasks,
  pathsOverlap,
  release,
  run,
  setStatus,
  verifyBranch
} from '../../scripts/task-claim.mjs'

/**
 * 任务认领台账（scripts/task-claim.mjs）的回归用例。
 *
 * 台账是并行 worktree 治理的中央事实源：重叠判定错一个边界（a/ 与 ab/），
 * 两个任务就会改到同一批文件；派生产物漏放一个（dist/），整合就会拿构建输出
 * 当源码合入。全部用例以临时目录为 root，不碰真实仓库台账。
 */

let root: string

const claimArgs = (over: Record<string, unknown> = {}) => ({
  root,
  id: 't1',
  owner: 'alice',
  branch: 'feat/t1',
  owns: ['packages/ui-kit/src/components/button/'],
  base: 'deadbeef',
  ...over
})

const readActive = () => JSON.parse(readFileSync(path.join(root, '.tasks', 'active.json'), 'utf8'))
const readHistory = () =>
  readFileSync(path.join(root, '.tasks', 'history.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'task-claim-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('路径边界重叠判定', () => {
  it('目录前缀与其下文件相交', () => {
    expect(pathsOverlap('a/', 'a/b.ts')).toBe(true)
    expect(pathsOverlap('a/b.ts', 'a/')).toBe(true)
  })

  it('目录前缀与同名不同边界不相交：a/ 与 ab/ 不相交', () => {
    expect(pathsOverlap('a/', 'ab/')).toBe(false)
    expect(pathsOverlap('ab/', 'a/')).toBe(false)
    expect(pathsOverlap('a/', 'ab.ts')).toBe(false)
  })

  it('完全相同的文件路径相交', () => {
    expect(pathsOverlap('registry.mjs', 'registry.mjs')).toBe(true)
  })

  it('兄弟目录不相交', () => {
    expect(pathsOverlap('packages/ui-kit/src/components/button/', 'packages/ui-kit/src/components/badge/')).toBe(false)
  })

  it('目录与其自身前缀的嵌套目录相交', () => {
    expect(pathsOverlap('packages/', 'packages/ui-kit/')).toBe(true)
  })
})

describe('派生产物不可 own', () => {
  it.each(DERIVED_ARTIFACTS)('owns 命中 %s 一律拒绝', (...[artifact]) => {
    expect(hitsDerivedArtifact(artifact)).toBe(true)
    const result = claim(claimArgs({ owns: [artifact] }))
    expect(result.ok).toBe(false)
    expect(String(result.error)).toContain('派生产物')
    expect(listTasks({ root })).toEqual({})
  })

  it('派生产物目录下的子路径同样拒绝（dist/sub/ 命中 dist/）', () => {
    expect(hitsDerivedArtifact('dist/full/')).toBe(true)
    expect(hitsDerivedArtifact('coverage/lcov-report/')).toBe(true)
  })

  it('命名相近但不共享路径边界的源码路径不被误伤', () => {
    expect(hitsDerivedArtifact('dists/')).toBe(false)
    expect(hitsDerivedArtifact('src/sizes.json.ts')).toBe(false)
  })
})

describe('check 干跑校验', () => {
  it('空台账时任意 owns 无重叠，不写台账', () => {
    const result = checkOverlap({ root, owns: ['packages/'] })
    expect(result.ok).toBe(true)
    expect(result.conflicts).toEqual([])
    expect(listTasks({ root })).toEqual({})
  })

  it('与活跃任务相交时返回冲突 id 与相交路径', () => {
    claim(claimArgs())
    const result = checkOverlap({ root, owns: ['packages/ui-kit/src/components/button/core.ts'] })
    expect(result.ok).toBe(false)
    expect(result.conflicts).toEqual([
      {
        id: 't1',
        owner: 'alice',
        intersect: ['packages/ui-kit/src/components/button/core.ts ∩ packages/ui-kit/src/components/button/']
      }
    ])
  })

  it('不相交路径（button/ vs badge/）通过校验', () => {
    claim(claimArgs())
    const result = checkOverlap({ root, owns: ['packages/ui-kit/src/components/badge/'] })
    expect(result.ok).toBe(true)
  })
})

describe('claim / status / release 生命周期', () => {
  it('claim 写台账：schema 字段齐全，状态从 running 起步', () => {
    const result = claim(claimArgs({ ttl: 90, worktree: '.worktrees/t1' }))
    expect(result.ok).toBe(true)
    expect(readActive()).toEqual({
      version: 1,
      tasks: {
        t1: {
          owner: 'alice',
          branch: 'feat/t1',
          worktree: '.worktrees/t1',
          owns: ['packages/ui-kit/src/components/button/'],
          status: 'running',
          baseCommit: 'deadbeef',
          claimedAt: expect.any(Number),
          ttlMinutes: 90
        }
      }
    })
    expect(readHistory().at(-1)).toMatchObject({ event: 'claim', id: 't1', owner: 'alice' })
  })

  it('ttl 默认 180，缺 id/owner/branch 拒绝', () => {
    expect(claim(claimArgs({ ttl: undefined })).task).toMatchObject({ ttlMinutes: 180 })
    for (const drop of ['id', 'owner', 'branch'] as const) {
      const args = { ...claimArgs({ id: `t-${drop}` }), [drop]: '' }
      expect(claim(args).ok).toBe(false)
    }
  })

  it('重复 id 拒绝，原任务不受影响', () => {
    expect(claim(claimArgs()).ok).toBe(true)
    const dup = claim(claimArgs({ owns: ['packages/ui-kit/src/components/badge/'] }))
    expect(dup.ok).toBe(false)
    expect(String(dup.error)).toContain('已存在')
    expect(Object.keys(listTasks({ root }))).toEqual(['t1'])
  })

  it('status 迁移合法状态并追加 history，拒绝未知状态', () => {
    claim(claimArgs())
    expect(setStatus({ root, id: 't1', status: 'integrating' }).ok).toBe(true)
    expect(readActive().tasks.t1.status).toBe('integrating')
    expect(setStatus({ root, id: 't1', status: 'done' }).ok).toBe(true)
    expect(readActive().tasks.t1.status).toBe('done')
    const bad = setStatus({ root, id: 't1', status: 'merged' })
    expect(bad.ok).toBe(false)
    expect(readActive().tasks.t1.status).toBe('done')
    const events = readHistory().filter((e) => e.event === 'status')
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ id: 't1', from: 'running', to: 'integrating' })
  })

  it('release 归档：从 active 移除，history 追加 release 事件', () => {
    claim(claimArgs())
    setStatus({ root, id: 't1', status: 'done' })
    const result = release({ root, id: 't1', status: 'done' })
    expect(result.ok).toBe(true)
    expect(listTasks({ root })).toEqual({})
    expect(readHistory().at(-1)).toMatchObject({ event: 'release', id: 't1', status: 'done' })
    expect(release({ root, id: 't1' }).ok).toBe(false)
  })
})

describe('gc TTL 回收', () => {
  const MIN = 60_000
  const claimedAt = Date.now() - 10 * MIN

  it('未过期任务不动', () => {
    claim(claimArgs())
    const result = gc({ root, now: Date.now() })
    expect(result).toEqual({ released: [], kept: [] })
    expect(Object.keys(listTasks({ root }))).toEqual(['t1'])
  })

  it('过期且无 worktree（视为干净）直接 release', () => {
    claim(claimArgs({ claimedAt, ttl: 5 }))
    const result = gc({ root, now: Date.now() })
    expect(result.released).toEqual(['t1'])
    expect(result.kept).toEqual([])
    expect(listTasks({ root })).toEqual({})
    expect(readHistory().at(-1)).toMatchObject({ event: 'release', id: 't1', status: 'aborted', via: 'gc' })
  })

  it('过期但 worktree 有未提交改动：置 aborted 且保留在 active', () => {
    const worktree = path.join(root, '.worktrees', 't1')
    mkdirSync(worktree, { recursive: true })
    execFileSync('git', ['init'], { cwd: worktree, stdio: 'ignore' })
    writeFileSync(path.join(worktree, 'dirty.txt'), 'not committed')
    claim(claimArgs({ claimedAt, ttl: 5, worktree }))
    const result = gc({ root, now: Date.now() })
    expect(result.released).toEqual([])
    expect(result.kept).toEqual(['t1'])
    expect(readActive().tasks.t1.status).toBe('aborted')
    // worktree 里的改动还在，没有被误回收
    expect(() => readFileSync(path.join(worktree, 'dirty.txt'))).not.toThrow()
  })

  it('过期且 worktree 干净（git init 后无改动）release', () => {
    const worktree = path.join(root, '.worktrees', 't1')
    mkdirSync(worktree, { recursive: true })
    execFileSync('git', ['init'], { cwd: worktree, stdio: 'ignore' })
    claim(claimArgs({ claimedAt, ttl: 5, worktree }))
    const result = gc({ root, now: Date.now() })
    expect(result.released).toEqual(['t1'])
    expect(listTasks({ root })).toEqual({})
  })
})

describe('verify-branch 派生产物拦截', () => {
  it('worktree 不是 git 仓库时返回错误而不是误判通过', () => {
    claim(claimArgs())
    const result = verifyBranch({ root, id: 't1' })
    expect(result.ok).toBe(false)
  })

  it('git diff 失败（无 baseCommit）明确报错', () => {
    claim(claimArgs({ base: null }))
    expect(String(verifyBranch({ root, id: 't1' }).error)).toContain('baseCommit')
  })
})

describe('CLI', () => {
  const SCRIPT = path.resolve(__dirname, '../../scripts/task-claim.mjs')
  const cli = (args: string[]) =>
    execFileSync(process.execPath, [SCRIPT, '--root', root, ...args], { encoding: 'utf8' })

  it('--help 正常输出用法', () => {
    const out = execFileSync(process.execPath, [SCRIPT, '--help'], { encoding: 'utf8' })
    expect(out).toContain('check --owns')
    expect(out).toContain('verify-branch')
  })

  it('claim → list --json → release 全链路走 CLI', () => {
    expect(() =>
      cli(['claim', '--id', 'cli1', '--owner', 'bob', '--branch', 'feat/cli1', '--owns', 'registry.mjs,tests/build/'])
    ).not.toThrow()
    const listed = JSON.parse(cli(['list', '--json']))
    expect(listed.cli1).toMatchObject({ owner: 'bob', owns: ['registry.mjs', 'tests/build/'], status: 'running' })
    expect(() => cli(['release', '--id', 'cli1'])).not.toThrow()
    expect(JSON.parse(cli(['list', '--json']))).toEqual({})
  })

  it('check 冲突时 CLI 退出码为 1 并打印相交路径', () => {
    cli(['claim', '--id', 'c1', '--owner', 'a', '--branch', 'b/c1', '--owns', 'tests/'])
    let stderr = ''
    try {
      execFileSync(process.execPath, [SCRIPT, '--root', root, 'check', '--owns', 'tests/build/'], {
        encoding: 'utf8',
        stdio: 'pipe'
      })
    } catch (err) {
      stderr = String((err as { stderr: string }).stderr)
    }
    expect(stderr).toContain('c1')
    expect(stderr).toContain('tests/build/')
  })

  it('run() 入口对未知命令返回退出码 1', () => {
    expect(run(['nope'])).toBe(1)
    expect(run(['list', '--root', root])).toBe(0)
  })
})
