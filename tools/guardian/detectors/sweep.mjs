import { spawn, spawnSync } from 'node:child_process'
import { openSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { sweepPort } from '../../scripts/worktree-ports.mjs'

const PORT = sweepPort
const SWEEP_TIMEOUT = 420

function hasEgo() {
  const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['ego-browser'], {
    shell: process.platform === 'win32',
    windowsHide: true
  })
  return probe.status === 0
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // 服务尚未就绪
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`dev server 在 ${timeoutMs}ms 内未就绪: ${url}`)
}

function startServer(ctx) {
  const commandLine = `npx vite --port ${PORT} --strictPort`
  return spawn('cmd.exe', ['/d', '/s', '/c', commandLine], {
    cwd: join(ctx.dir, 'examples', 'consumer'),
    detached: true,
    windowsHide: true,
    stdio: 'ignore'
  })
}

function stopServer(child) {
  if (!child || child.killed) {
    return
  }
  spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true })
}

function egoScript() {
  return `const task = await taskSpace('guardian-sweep')
const page = task.page('p1')
await page.goto('http://localhost:${PORT}/')
await new Promise((r) => setTimeout(r, 2500))
const meta = await page.evaluate(async () => {
  const mod = await import('/src/demo/meta.json')
  return mod.default.components.map((c) => c.id)
})
await page.evaluate(() => {
  window.__gErrs = []
  window.addEventListener('error', (e) => window.__gErrs.push(String(e.message)))
  window.addEventListener('unhandledrejection', (e) =>
    window.__gErrs.push('unhandled: ' + String((e.reason && e.reason.message) || e.reason))
  )
  const original = console.error
  console.error = (...args) => {
    window.__gErrs.push('console.error: ' + args.map(String).join(' ').slice(0, 200))
    original(...args)
  }
})
const failures = []
for (const id of meta) {
  await page.evaluate((cid) => {
    window.__gErrs.length = 0
    location.hash = '#/c/' + cid
  }, id)
  await new Promise((r) => setTimeout(r, 1100))
  const info = await page.evaluate(() => {
    const stage = document.querySelector('.pg-stage__canvas')
    return {
      errs: window.__gErrs.slice(),
      stageChildren: stage ? stage.children.length : -1,
      missing: Boolean(document.querySelector('.cp-missing'))
    }
  })
  if (info.errs.length || info.stageChildren === 0 || info.stageChildren === -1 || info.missing) {
    failures.push({ component: id, ...info })
  }
}
await task.finish({ keep: [] })
console.log('SWEEP_RESULT:' + JSON.stringify({ total: meta.length, checked: meta.length - failures.length, failures }))
`
}

function runEgo(scriptFile, timeout) {
  return new Promise((resolvePromise) => {
    const fd = openSync(scriptFile, 'r')
    const child = spawn('ego-browser', ['nodejs'], {
      shell: true,
      stdio: [fd, 'pipe', 'pipe'],
      timeout: timeout * 1000,
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

function extractResult(stdout) {
  const line = stdout.split('\n').find((entry) => entry.trim().startsWith('SWEEP_RESULT:'))
  if (!line) {
    return null
  }
  try {
    return JSON.parse(line.trim().slice('SWEEP_RESULT:'.length))
  } catch {
    return null
  }
}

export const sweepDetector = {
  id: 'sweep',
  title: `浏览器巡检（默认包全组件渲染 + 运行时错误，端口 ${PORT}）`,
  kind: 'advisory',
  run: async (ctx) => {
    if (!hasEgo()) {
      ctx.log('未找到 ego-browser，跳过 sweep 探针')
      return { failures: [] }
    }
    let server = null
    try {
      server = startServer(ctx)
      await waitForHttp(`http://localhost:${PORT}/`, 90000)
      const guardianDir = join(ctx.dir, '.guardian')
      const scriptFile = join(guardianDir, 'sweep-ego.mjs')
      writeFileSync(scriptFile, egoScript())
      ctx.log('sweep: dev server 就绪，开始逐组件巡检')
      const result = runEgo(scriptFile, SWEEP_TIMEOUT)
      const ego = await result
      rmSync(scriptFile, { force: true })
      if (ego.code !== 0) {
        return {
          failures: [
            {
              key: 'ego-crash',
              summary: `ego 巡检进程异常退出（code ${ego.code}）`,
              output: `${ego.stdout}\n${ego.stderr}`.slice(-4000)
            }
          ]
        }
      }
      const egoText = `${ego.stdout}\n${ego.stderr}`
      const data = extractResult(egoText)
      if (!data) {
        return {
          failures: [
            {
              key: 'no-result',
              summary: 'sweep 未返回结构化结果',
              output: egoText.slice(-4000)
            }
          ]
        }
      }
      ctx.log(`sweep: ${data.total} 个组件，${data.failures.length} 个异常`)
      return {
        failures: data.failures.map((failure) => {
          const lines = [
            `component: ${failure.component}`,
            `stageChildren: ${failure.stageChildren}`,
            `missing: ${failure.missing}`
          ]
          for (const error of failure.errs.slice(0, 5)) {
            lines.push(`error: ${error}`)
          }
          return {
            key: failure.component,
            summary: failure.errs[0]
              ? `${failure.component}: ${failure.errs[0].slice(0, 100)}`
              : `${failure.component}: 舞台未渲染（stageChildren=${failure.stageChildren}）`,
            output: lines.join('\n')
          }
        })
      }
    } catch (error) {
      return {
        failures: [
          {
            key: 'probe-crash',
            summary: `sweep 探针崩溃: ${error.message}`,
            output: String(error.stack || error).slice(-4000)
          }
        ]
      }
    } finally {
      stopServer(server)
    }
  }
}
