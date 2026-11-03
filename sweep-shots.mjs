import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import path from 'path'

const BASE = 'http://localhost:5181'
const OUT = path.resolve('shots')
const PKGS = ['Full 全特性', 'Chinese 中国风', 'Ant Design']
const meta = JSON.parse(readFileSync('examples/consumer/src/demo/meta.json', 'utf8'))
const components = meta.components.map((c) => c.id)
const doneFile = path.join(OUT, 'progress.json')
const doneSet = new Set(existsSync(doneFile) ? JSON.parse(readFileSync(doneFile, 'utf8')) : [])
const log = []
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

let consoleErrors = []
let pageErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200))
})
page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 200)))

function safe(name) {
  return name.replace(/[\\/:*?"<>|\s]+/g, '_')
}

async function switchPkg(label) {
  await page.evaluate((n) => {
    const btn = [...document.querySelectorAll('button')]
      .find((e) => e.textContent.trim().startsWith(n) && e.offsetParent)
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }, label)
  // 等 eyebrow 反映目标包
  await page.waitForFunction(
    (n) => document.querySelector('.cp-eyebrow')?.textContent.includes(n),
    label,
    { timeout: 8000 }
  ).catch(() => {})
  await page.waitForTimeout(900)
}

async function clickAndShoot(btn, file) {
  consoleErrors = []
  pageErrors = []
  await btn.dispatchEvent('click')
  await page.waitForTimeout(900)
  const state = await page.evaluate(() => {
    const stage = document.querySelector('.pg-stage')
    const canvas = document.querySelector('.pg-stage__canvas')
    const kid = canvas ? [...canvas.children].find((c) => c.getBoundingClientRect().width > 0) : null
    return {
      stageW: stage ? Math.round(stage.getBoundingClientRect().width) : 0,
      stageH: stage ? Math.round(stage.getBoundingClientRect().height) : 0,
      kidCls: kid ? String(kid.className).split(' ')[0] : '',
      kidW: kid ? Math.round(kid.getBoundingClientRect().width) : 0,
      bodyOverlays: [...document.querySelectorAll('body > div')].filter(
        (d) => d.className && /dialog|drawer|overlay|message|notification|popover|tooltip/i.test(String(d.className))
      ).length
    }
  })
  await page.screenshot({ path: file })
  return { ...state, consoleErrors: [...consoleErrors], pageErrors: [...pageErrors] }
}

let shotCount = 0
for (const id of components) {
  const compDir = path.join(OUT, id)
  mkdirSync(compDir, { recursive: true })
  try {
    await page.goto(`${BASE}/#/c/${id}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1800)
  } catch (e) {
    log.push({ component: id, error: `goto failed: ${String(e).slice(0, 120)}` })
    continue
  }
  for (const pkg of PKGS) {
    await switchPkg(pkg)
    const pkgKey = pkg.split(' ')[0]
    // 导出 tab（可能只有一个）
    const exportNames = await page.evaluate(() =>
      [...document.querySelectorAll('.cp-tabs button')].map((b) => b.textContent.trim())
    )
    const exports = exportNames.length ? exportNames : ['']
    for (const exp of exports) {
      if (exp) {
        await page.evaluate((n) => {
          [...document.querySelectorAll('.cp-tabs button')].find((b) => b.textContent.trim() === n)
            ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }, exp)
        await page.waitForTimeout(600)
      }
      const sceneBtns = await page.$$eval('.cp-scenes button:not([disabled])', (btns) =>
        btns.map((b, i) => ({ i, label: b.textContent.trim() }))
      )
      for (const scene of sceneBtns) {
        const key = `${id}|${pkgKey}|${exp}|${scene.label}`
        if (doneSet.has(key)) continue
        const btn = (await page.$$('.cp-scenes button:not([disabled])'))[scene.i]
        if (!btn) continue
        const file = path.join(compDir, `${pkgKey}__${safe(exp)}__${safe(scene.label)}.png`)
        const state = await clickAndShoot(btn, file).catch((e) => ({ error: String(e).slice(0, 120) }))
        log.push({ component: id, pkg: pkgKey, export: exp, scene: scene.label, file, ...state })
        doneSet.add(key)
        shotCount += 1
        if (shotCount % 50 === 0) {
          writeFileSync(doneFile, JSON.stringify([...doneSet]))
          writeFileSync(path.join(OUT, 'log.json'), JSON.stringify(log, null, 1))
          console.log(`progress: ${shotCount} shots`)
        }
      }
    }
  }
  writeFileSync(doneFile, JSON.stringify([...doneSet]))
  writeFileSync(path.join(OUT, 'log.json'), JSON.stringify(log, null, 1))
}
console.log(`DONE: ${shotCount} shots`)
await browser.close()
