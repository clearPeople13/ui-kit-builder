#!/usr/bin/env node
/**
 * 视觉体检（能力层，不是用例层）。
 *
 * 像素基线的隐含前提是"当前这一版是对的"，所以它只能防"以后变"，
 * 永远发现不了"现在就长歪了"——TimePicker 的双层边框就是在基线录好之后
 * 一直被当成正确答案的。本脚本换一个前提：把样式写成可计算的视觉契约，
 * 在真实 Chromium 里对全家桶场景的每一个组件逐条体检，不依赖任何基线。
 *
 * 同时产出人能看、助手也能看的画廊：每个组件一张截图，异常项标红并写明命中规则。
 * 这就是"视觉能力"的落点——样式改动不再只靠断言，而是有图、有规则、有复核入口。
 *
 * 用法：
 *   npm run audit:visual                 # 体检 + 生成画廊，有 error 即非零退出
 *   node scripts/visual-audit.mjs --json path/to/audit.json
 *
 * 需要 dist/full 产物（门禁里由 build 段保证）。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import { createServer } from 'vite'

const repoRoot = path.resolve(fileURLToPath(new URL('../', import.meta.url)))
const outDir = path.join(repoRoot, 'visual-report')
const shotDir = path.join(outDir, 'shots')
const argv = process.argv.slice(2)
const jsonFlag = argv.indexOf('--json')
const jsonPath = jsonFlag >= 0 ? path.resolve(argv[jsonFlag + 1]) : path.join(outDir, 'audit.json')

/** 规则版本：治理校验静态核对，防止有人把体检器改空了还留着门禁段 */
export const AUDIT_RULES = [
  'nested-border',
  'opaque-fill',
  'nested-padding',
  'font-mismatch',
  'clipped-text',
  'render-gap'
]

/**
 * 辅助组件：脱离父上下文就不会渲染任何可见节点，必须显式豁免。
 * 至少要覆盖 harness 的 GALLERY_SKIP（治理校验静态核对）；多出的几项同样不渲染
 * 可见根节点，理由登记在 REQUIREMENTS.md §16.4。体检器另有反向守卫：
 * 白名单里的组件一旦渲染出可见根节点就报错，白名单不会变成藏缺陷的后门。
 */
export const NON_VISUAL = ['CollapseTransition', 'Collection', 'CollectionItem', 'OnlyChild']

/** 重点场景：默认态画廊里很多组件没有内容，这几页才是人眼复核的主战场 */
const FOCUS_SCENES = ['floating', 'table', 'tree', 'color', 'a11y', 'time-picker']

/**
 * 消费方真实界面（F-67）：harness 走源码，调试台走 dist 产物，两条路径缺一不可。
 * 第九批只体检了源码，结果源码修好了、调试台却因跨工作树软链仍在加载旧 CSS，
 * 用户看到的界面照样是双层边框。这里直接打开用户评审用的组件页做同一套契约。
 */
/** 体检自带的两台 Vite 服务端口：避开 5173 段的 dev server 与工作树端口段 */
function randomPort() {
  return 36000 + Math.floor(Math.random() * 2000)
}

const CONSUMER_PAGES = ['time-picker', 'input', 'date-picker', 'autocomplete', 'input-number']

/**
 * 第十一批：两个选择器合并后，大数据能力由调试台的真实场景承载。
 * 不只看"场景按钮在不在"，还要点开它、展开面板，确认 1 万条只渲染可视区。
 */
const BIG_DATA_SCENE = {
  pageId: 'select',
  label: '大数据虚拟列表',
  shot: 'consumer-select-virtual.png',
  maxRenderedOptions: 30,
  minVirtualHeight: 100_000
}

const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  )

const RULE_LABEL = {
  'nested-border': '双层边框',
  'opaque-fill': '内层不透明底色',
  'nested-padding': '内层额外内边距',
  'font-mismatch': '字体与外壳不一致',
  'clipped-text': '文本被裁切',
  'render-gap': '渲染缺口'
}

/**
 * 页面内体检：只用 getComputedStyle / getBoundingClientRect，不读源码、不读快照。
 * 所有判定都是"肉眼可见的事实"的机读表达，因此可以跨主题、跨 profile 复用。
 */
function inspectInPage({ nonVisual }) {
  const px = (value) => Number.parseFloat(value) || 0
  const frameWidth = (style) =>
    Math.max(
      px(style.borderTopWidth),
      px(style.borderRightWidth),
      px(style.borderBottomWidth),
      px(style.borderLeftWidth)
    )
  const isTransparent = (color) => color === 'transparent' || /^rgba\([^)]*,\s*0\)$/.test(color)
  const findings = []
  const components = []
  const nodes = Array.from(document.querySelectorAll('[data-gallery]'))

  for (const host of nodes) {
    const name = host.getAttribute('data-gallery') || '<unknown>'
    const shell = host.firstElementChild
    const own = []
    const push = (rule, severity, detail) => {
      const item = { component: name, rule, severity, detail }
      findings.push(item)
      own.push(item)
    }

    if (!shell) {
      if (!nonVisual.includes(name)) {
        push('render-gap', 'error', '组件没有渲染任何根节点，且不在辅助组件豁免清单里')
      }
      components.push({ name, width: 0, height: 0, controls: 0, clip: [0, 0, 0, 0], findings: own })
      continue
    }

    // 反向守卫：白名单里的组件若哪天渲染出可见根节点，说明它已经是真组件，
    // 必须移出豁免名单接受完整体检，否则白名单会变成藏缺陷的后门
    if (nonVisual.includes(name)) {
      push('render-gap', 'error', '辅助组件现在渲染了可见根节点，请从 NON_VISUAL 豁免清单移除并纳入正常体检')
    }

    const hostBox = host.getBoundingClientRect()
    // 文档坐标：整页只截一次，逐组件图由 Node 侧按这个矩形裁出来，
    // 避免 123 次 element.screenshot（每次都要滚动 + 等稳定，门禁会多跑四分钟）
    const clip = [
      Math.max(0, Math.round(hostBox.left + window.scrollX)),
      Math.max(0, Math.round(hostBox.top + window.scrollY)),
      Math.max(0, Math.round(hostBox.width)),
      Math.max(0, Math.round(hostBox.height))
    ]
    const shellStyle = getComputedStyle(shell)

    const controls = Array.from(shell.querySelectorAll('input, textarea, select'))
    for (const control of controls) {
      const style = getComputedStyle(control)
      const box = control.getBoundingClientRect()
      // 1×1 透明隐藏域（复选框/单选按钮的原生 input）不参与视觉契约
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        Number(style.opacity) === 0 ||
        box.width < 2 ||
        box.height < 2
      ) {
        continue
      }
      const selfFrame = frameWidth(style)
      // 只在组件外壳范围内找"另一个也画了边框的祖先"；越过外壳就不算套框
      let framedAncestor = null
      for (let parent = control.parentElement; parent && parent !== host; parent = parent.parentElement) {
        if (frameWidth(getComputedStyle(parent)) > 0.5) {
          framedAncestor = parent
          break
        }
      }
      const label = `${control.tagName.toLowerCase()}.${String(control.className || '').split(' ')[0] || '(无类名)'}`

      if (framedAncestor && selfFrame > 0.5) {
        push(
          'nested-border',
          'error',
          `${label} 自己有 ${selfFrame}px 边框，祖先 .${String(framedAncestor.className).trim().split(' ')[0]} 也有边框，构成框中框`
        )
      }
      if (framedAncestor && !isTransparent(style.backgroundColor)) {
        push('opaque-fill', 'warning', `${label} 背景 ${style.backgroundColor} 不透明，与外壳底色叠成色块`)
      }
      if (framedAncestor && (px(style.paddingLeft) > 0 || px(style.paddingRight) > 0)) {
        push(
          'nested-padding',
          'warning',
          `${label} 左右内边距 ${style.paddingLeft}/${style.paddingRight}，文本会相对图标内缩`
        )
      }
      if (framedAncestor && style.fontFamily.split(',')[0].trim() !== shellStyle.fontFamily.split(',')[0].trim()) {
        push('font-mismatch', 'warning', `${label} 字体 ${style.fontFamily.split(',')[0]} 与外壳不一致`)
      }
      if (
        control.tagName === 'INPUT' &&
        control.value &&
        box.width > 0 &&
        control.scrollWidth > control.clientWidth + 1 &&
        style.textOverflow !== 'ellipsis'
      ) {
        push(
          'clipped-text',
          'error',
          `${label} 文本宽 ${control.scrollWidth}px 超出可见宽 ${control.clientWidth}px 且未省略`
        )
      }
    }

    components.push({
      name,
      width: Math.round(hostBox.width),
      height: Math.round(hostBox.height),
      controls: controls.length,
      clip,
      findings: own
    })
  }

  return { components, findings, galleryNames: window.__probe?.galleryNames ?? [] }
}

/**
 * 消费方页面内体检：规则与 inspectInPage 完全一致，区别只在组件根的找法——
 * 调试台没有 [data-gallery] 宿主，改为向上找最近的类名形如 ui-xxx（不含 __）的根节点。
 * 外壳自己的搜索框等控件没有这样的祖先，会自动跳过，不算进体检。
 */
function inspectConsumerInPage({ pageId }) {
  const px = (value) => Number.parseFloat(value) || 0
  const frameWidth = (style) =>
    Math.max(
      px(style.borderTopWidth),
      px(style.borderRightWidth),
      px(style.borderBottomWidth),
      px(style.borderLeftWidth)
    )
  const isTransparent = (color) => color === 'transparent' || /^rgba\([^)]*,\s*0\)$/.test(color)
  const findings = []
  const push = (rule, severity, detail) => findings.push({ component: `consumer/${pageId}`, rule, severity, detail })
  let controls = 0

  for (const control of document.querySelectorAll('input, textarea, select')) {
    const style = getComputedStyle(control)
    const box = control.getBoundingClientRect()
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number(style.opacity) === 0 ||
      box.width < 2 ||
      box.height < 2
    ) {
      continue
    }
    let root = null
    for (let parent = control.parentElement; parent; parent = parent.parentElement) {
      if (
        String(parent.className || '')
          .split(' ')
          .some((name) => /^ui-[a-z0-9-]+$/.test(name) && !name.includes('__'))
      ) {
        root = parent
        break
      }
    }
    if (!root) {
      continue
    }
    controls += 1

    const shellStyle = getComputedStyle(root)
    let framedAncestor = null
    for (let parent = control.parentElement; parent && parent !== root.parentElement; parent = parent.parentElement) {
      if (frameWidth(getComputedStyle(parent)) > 0.5) {
        framedAncestor = parent
        break
      }
    }
    const label = `${control.tagName.toLowerCase()}.${String(control.className || '').split(' ')[0] || '(无类名)'}`

    if (framedAncestor && frameWidth(style) > 0.5) {
      push(
        'nested-border',
        'error',
        `${label} 自己有 ${frameWidth(style)}px 边框，祖先 .${String(framedAncestor.className).trim().split(' ')[0]} 也有边框；消费方页面加载的产物与源码不一致`
      )
    }
    if (framedAncestor && !isTransparent(style.backgroundColor)) {
      push('opaque-fill', 'warning', `${label} 背景 ${style.backgroundColor} 不透明，与外壳底色叠成色块`)
    }
    if (framedAncestor && (px(style.paddingLeft) > 0 || px(style.paddingRight) > 0)) {
      push('nested-padding', 'warning', `${label} 左右内边距 ${style.paddingLeft}/${style.paddingRight}`)
    }
    if (framedAncestor && style.fontFamily.split(',')[0].trim() !== shellStyle.fontFamily.split(',')[0].trim()) {
      push('font-mismatch', 'warning', `${label} 字体 ${style.fontFamily.split(',')[0]} 与外壳不一致`)
    }
    if (
      control.tagName === 'INPUT' &&
      control.value &&
      box.width > 0 &&
      control.scrollWidth > control.clientWidth + 1 &&
      style.textOverflow !== 'ellipsis'
    ) {
      push(
        'clipped-text',
        'error',
        `${label} 文本宽 ${control.scrollWidth}px 超出可见宽 ${control.clientWidth}px 且未省略`
      )
    }
  }

  return { controls, findings }
}

function renderGallery(report) {
  const consumerFindings = report.findings.filter((entry) => entry.component.startsWith('consumer/'))
  const cards = report.componentsDetail
    .map((item) => {
      const errors = item.findings.filter((entry) => entry.severity === 'error')
      const warnings = item.findings.filter((entry) => entry.severity === 'warning')
      const tags = [
        ...item.findings.map(
          (entry) => `<span class="tag ${entry.severity}">${esc(RULE_LABEL[entry.rule] ?? entry.rule)}</span>`
        ),
        item.shotFallback ? '<span class="tag">默认态无内容</span>' : ''
      ].join('')
      const details = item.findings.map((entry) => `<li>${esc(entry.detail)}</li>`).join('')
      const visual =
        item.width > 0 && item.height > 0
          ? `<a href="shots/${encodeURIComponent(item.name)}.png" target="_blank"><img src="shots/${encodeURIComponent(item.name)}.png" alt="${esc(item.name)}" loading="lazy"></a>`
          : '<div class="empty">默认态无可视图层 · 请在重点场景或调试台复核</div>'
      return `<article class="card ${errors.length ? 'bad' : warnings.length ? 'warn' : ''}">
  <header><strong>${esc(item.name)}</strong><span class="dim">${item.width}×${item.height}${item.controls ? ` · ${item.controls} 控件` : ''}</span></header>
  ${visual}
  <div class="tags">${tags || '<span class="tag ok">无异常</span>'}</div>${details ? `<ul>${details}</ul>` : ''}
</article>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>UI Kit 视觉体检画廊</title>
<style>
:root{color-scheme:light}*{box-sizing:border-box}
body{margin:0;padding:24px;background:#f7f8fc;color:#1f2533;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif}
h1{margin:0 0 6px;font-size:20px}p.sub{margin:0 0 18px;color:#6b7280}
.stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.stat{background:#fff;border:1px solid #e5e8f0;border-radius:8px;padding:10px 16px;min-width:120px}
.stat b{display:block;font-size:22px;line-height:1.2}.stat span{color:#6b7280;font-size:12px}
.stat.bad b{color:#c0392b}.stat.ok b{color:#1a7f4b}
.legend{margin:0 0 18px;color:#6b7280;font-size:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.card{background:#fff;border:1px solid #e5e8f0;border-radius:10px;padding:12px;overflow:hidden}
.card.bad{border:2px solid #d94a3d;background:#fff8f7}.card.warn{border-color:#e0a33a}
.card header{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px}
.card header strong{font-size:13px}.dim{color:#8b93a5;font-size:11px}
.card img{display:block;width:100%;height:120px;object-fit:contain;object-position:left center;background:linear-gradient(135deg,#fff,#f2f4fb);border:1px solid #eef0f6;border-radius:6px}
.empty{display:flex;align-items:center;justify-content:center;height:120px;background:#f4f6fb;border:1px dashed #d9deea;border-radius:6px;color:#98a0b3;font-size:11px;text-align:center;padding:8px}
.focus{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:14px;margin-bottom:24px}
.focus figure{margin:0;background:#fff;border:1px solid #e5e8f0;border-radius:10px;padding:12px}
.focus figcaption{font-size:12px;color:#4b5568;margin-bottom:8px}
.focus img{display:block;width:100%;border:1px solid #eef0f6;border-radius:6px}
h2{font-size:15px;margin:0 0 10px}
.tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.tag{font-size:11px;padding:2px 7px;border-radius:10px;background:#eef1f7;color:#4b5568}
.tag.error{background:#fde8e6;color:#b3312a}.tag.warning{background:#fff2d9;color:#96620b}.tag.ok{background:#e5f5ea;color:#1a7f4b}
.card ul{margin:8px 0 0;padding-left:18px;color:#6b7280;font-size:11px}
code{background:#eef1f7;padding:1px 5px;border-radius:4px}
</style></head><body>
<h1>UI Kit 视觉体检画廊</h1>
<p class="sub">生成于 ${esc(report.generatedAt)} · 真实 Chromium 1280×720 · 规则版本 ${esc(report.rulesVersion)} · 点图可放大查看原图</p>
<div class="stats">
  <div class="stat"><b>${report.components}</b><span>体检组件</span></div>
  <div class="stat ${report.errors ? 'bad' : 'ok'}"><b>${report.errors}</b><span>阻断项（error）</span></div>
  <div class="stat"><b>${report.warnings}</b><span>提示项（warning）</span></div>
  <div class="stat"><b>${report.shots}</b><span>组件截图</span></div>
  <div class="stat ${consumerFindings.some((item) => item.severity === 'error') ? 'bad' : 'ok'}"><b>${report.consumerControls ?? 0}</b><span>调试台控件</span></div>
</div>
<p class="legend">规则：${AUDIT_RULES.map((rule) => `<code>${esc(RULE_LABEL[rule] ?? rule)}</code>`).join(' ')}。阻断项会令 <code>npm run audit:visual</code> 非零退出；画廊不进版本库，每次体检重新生成。</p>
<h2>消费方真实界面（dist 产物驱动）</h2>
<p class="legend">调试台组件页加载 <code>dist/&lt;profile&gt;/ui-kit.css</code>，与逐组件的源码画廊互补；这里才能发现「源码修好了、构建产物或加载路径没跟上」的偏差。体检 ${esc((report.consumerPages ?? []).length)} 页 / ${esc(report.consumerControls ?? 0)} 个控件，异常 ${consumerFindings.length} 项${consumerFindings.length ? `：${consumerFindings.map((item) => `<code>${esc(item.component)} ${esc(RULE_LABEL[item.rule] ?? item.rule)}</code>`).join(' ')}` : ''}</p>
<div class="focus">${(report.consumerPages ?? [])
    .map(
      (name) =>
        `<figure><figcaption>${esc(name)}</figcaption><a href="shots/consumer-${encodeURIComponent(name)}.png" target="_blank"><img src="shots/consumer-${encodeURIComponent(name)}.png" alt="${esc(name)} 调试台页面" loading="lazy"></a></figure>`
    )
    .join(
      ''
    )}${report.bigDataShot ? `<figure><figcaption>Select 大数据虚拟列表（调试台真实场景）</figcaption><a href="shots/${esc(report.bigDataShot)}" target="_blank"><img src="shots/${esc(report.bigDataShot)}" alt="Select 大数据虚拟列表" loading="lazy"></a></figure>` : ''}</div>
<h2>重点场景（真实交互态首屏）</h2>
<div class="focus">${report.focusScenes
    .map(
      (name) =>
        `<figure><figcaption>${esc(name)}</figcaption><a href="shots/scene-${encodeURIComponent(name)}.png" target="_blank"><img src="shots/scene-${encodeURIComponent(name)}.png" alt="${esc(name)} 场景" loading="lazy"></a></figure>`
    )
    .join('')}</div>
<h2>逐组件（默认态）</h2>
<div class="grid">${cards}</div>
</body></html>
`
}

async function main() {
  mkdirSync(shotDir, { recursive: true })

  const server = await createServer({
    root: repoRoot,
    configFile: false,
    logLevel: 'silent',
    define: {
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
    },
    server: { host: '127.0.0.1', port: randomPort(), strictPort: false }
  })
  await server.listen()
  const address = server.httpServer?.address()
  if (!address || typeof address === 'string') {
    await server.close()
    throw new Error('视觉体检的静态服务未能监听端口')
  }
  const base = `http://127.0.0.1:${address.port}/tests/browser/harness/index.html`

  // 第二台服务：用户评审用的组件调试台，走自己的 vite 配置与 dist 产物（F-67）
  const consumerServer = await createServer({
    root: path.join(repoRoot, 'examples/consumer'),
    configFile: path.join(repoRoot, 'examples/consumer/vite.config.mjs'),
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: randomPort(), strictPort: false }
  })
  await consumerServer.listen()
  const consumerAddress = consumerServer.httpServer?.address()
  if (!consumerAddress || typeof consumerAddress === 'string') {
    await consumerServer.close()
    await server.close()
    throw new Error('视觉体检的调试台服务未能监听端口')
  }
  const consumerBase = `http://127.0.0.1:${consumerAddress.port}/`

  const browser = await chromium.launch()
  let result
  let shots = 0
  let consumerControls = 0
  const consumerPages = []
  let bigDataShot = ''
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    await page.goto(`${base}?scene=gallery`, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__probe?.ready === true, undefined, { timeout: 30_000 })
    // 等字体与样式表真正落地，否则首屏会量到 fallback 字体
    await page.evaluate(async () => {
      await document.fonts.ready
      return true
    })
    // 持续动画会让元素永远"不稳定"，逐元素截图就会挂住；体检统一在静止态进行
    await page.addStyleTag({
      content:
        '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
    })

    result = await page.evaluate(inspectInPage, { nonVisual: NON_VISUAL })
    process.stdout.write(`体检完成：${result.components.length} 个组件，开始截图\n`)

    // 整页只截一次，逐组件图按文档坐标裁出来：123 次 element.screenshot 会让门禁多跑四分钟
    const galleryPng = PNG.sync.read(await page.screenshot({ fullPage: true, timeout: 30_000 }))
    const blank = new PNG({ width: 240, height: 32 })
    for (let i = 0; i < blank.data.length; i += 4) {
      blank.data[i] = 243
      blank.data[i + 1] = 244
      blank.data[i + 2] = 251
      blank.data[i + 3] = 255
    }
    const blankPng = PNG.sync.write(blank)

    for (const item of result.components) {
      const file = path.join(shotDir, `${item.name}.png`)
      const [x, y, w, h] = item.clip ?? [0, 0, 0, 0]
      const inside = w >= 2 && h >= 2 && x + w <= galleryPng.width && y + h <= galleryPng.height
      if (inside) {
        const crop = new PNG({ width: w, height: h })
        PNG.bitblt(galleryPng, crop, x, y, w, h, 0, 0)
        writeFileSync(file, PNG.sync.write(crop))
      } else {
        // 零尺寸 / 纯浮层组件没有可截取的矩形：占位图 + 画廊标注，仍保证一组件一图
        writeFileSync(file, blankPng)
        item.shotFallback = true
      }
      shots += 1
    }

    // 重点场景：默认态画廊里大量组件没有内容，这几页才是人眼 / 助手复核的主战场
    const focusShots = []
    for (const scene of FOCUS_SCENES) {
      await page.goto(`${base}?scene=${scene}`, { waitUntil: 'load' })
      await page.waitForFunction(() => window.__probe?.ready === true, undefined, { timeout: 30_000 })
      await page.addStyleTag({
        content:
          '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
      })
      await page.screenshot({ path: path.join(shotDir, `scene-${scene}.png`), timeout: 15_000 })
      focusShots.push(scene)
    }
    result.focusShots = focusShots

    // 自守卫：探针声明的组件数、实际渲染的组件数、截图数、重点场景数必须自洽
    const declared = result.galleryNames.length
    const rendered = result.components.length
    if (!declared || declared !== rendered) {
      result.findings.push({
        component: '<gallery>',
        rule: 'render-gap',
        severity: 'error',
        detail: `全家桶声明 ${declared} 个组件，实际渲染 ${rendered} 个，体检覆盖面不完整`
      })
    }
    if (shots !== rendered) {
      result.findings.push({
        component: '<gallery>',
        rule: 'render-gap',
        severity: 'error',
        detail: `${rendered} 个组件只产出 ${shots} 张图，画廊无法作为视觉复核依据`
      })
    }
    if (focusShots.length !== FOCUS_SCENES.length) {
      result.findings.push({
        component: '<focus>',
        rule: 'render-gap',
        severity: 'error',
        detail: `重点场景截图 ${focusShots.length}/${FOCUS_SCENES.length}，复核入口不完整`
      })
    }
    await page.close()

    // 消费方真实界面：同一个 Chromium 另起一页，逐页跑同一套计算样式契约。
    // 这一层专门抓「源码修了但 dist 产物 / 加载路径没跟上」——第九批的盲区。
    const consumerPage = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    for (const id of CONSUMER_PAGES) {
      await consumerPage.goto(`${consumerBase}#/c/${id}`, { waitUntil: 'load', timeout: 30_000 })
      await consumerPage.waitForTimeout(800)
      await consumerPage.addStyleTag({
        content:
          '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
      })
      const checked = await consumerPage.evaluate(inspectConsumerInPage, { pageId: id })
      result.findings.push(...checked.findings)
      consumerControls += checked.controls
      await consumerPage.screenshot({ path: path.join(shotDir, `consumer-${id}.png`), timeout: 15_000 })
      consumerPages.push(id)
    }
    // 第十一批：大数据示例必须在真实调试台里真的窗口化，而不是"按钮在、面板仍全量渲染"
    await consumerPage.goto(`${consumerBase}#/c/${BIG_DATA_SCENE.pageId}`, {
      waitUntil: 'load',
      timeout: 30_000
    })
    await consumerPage.waitForTimeout(800)
    await consumerPage.addStyleTag({
      content:
        '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
    })
    const sceneButton = consumerPage.locator('.cp-scenes button', { hasText: BIG_DATA_SCENE.label })
    const buttonReady = (await sceneButton.count()) > 0 && !(await sceneButton.first().isDisabled())
    if (!buttonReady) {
      result.findings.push({
        component: `consumer/${BIG_DATA_SCENE.pageId}-big-data`,
        rule: 'render-gap',
        severity: 'error',
        detail: '调试台里找不到可用的大数据虚拟列表场景（特性被裁剪或示例被删）'
      })
    } else {
      await sceneButton.first().click()
      await consumerPage.waitForTimeout(600)
      await consumerPage.locator('.ui-select__trigger').first().click()
      await consumerPage.waitForTimeout(400)
      const bigData = await consumerPage.evaluate(() => {
        const layer = document.querySelector('.ui-select__virtual')
        // §25：窗口结构改由 VirtualList 承载，占位高度落在它的 spacer 上；
        // 旧结构（特性自己撑一层）保留兼容，避免体检与具体实现绑死
        const spacer = layer?.querySelector('.ui-virtual-list__spacer')
        const height = Number.parseInt(spacer?.style.height ?? layer?.style.height ?? '0', 10) || 0
        return {
          virtual: Boolean(layer),
          options: document.querySelectorAll('.ui-select__option').length,
          height
        }
      })
      if (
        !bigData.virtual ||
        bigData.options < 1 ||
        bigData.options > BIG_DATA_SCENE.maxRenderedOptions ||
        bigData.height < BIG_DATA_SCENE.minVirtualHeight
      ) {
        result.findings.push({
          component: `consumer/${BIG_DATA_SCENE.pageId}-big-data`,
          rule: 'render-gap',
          severity: 'error',
          detail: `大数据场景没有真正窗口化：虚拟层 ${bigData.virtual} / 渲染 ${bigData.options} 个选项 / 占位高度 ${bigData.height}px`
        })
      }
    }
    await consumerPage.screenshot({ path: path.join(shotDir, BIG_DATA_SCENE.shot), timeout: 15_000 })
    bigDataShot = BIG_DATA_SCENE.shot
    await consumerPage.close()

    if (consumerPages.length !== CONSUMER_PAGES.length) {
      result.findings.push({
        component: '<consumer>',
        rule: 'render-gap',
        severity: 'error',
        detail: `调试台体检只覆盖 ${consumerPages.length}/${CONSUMER_PAGES.length} 页，产物路径没有真正被体检`
      })
    }
    if (consumerControls < CONSUMER_PAGES.length) {
      result.findings.push({
        component: '<consumer>',
        rule: 'render-gap',
        severity: 'error',
        detail: `${consumerPages.length} 个调试台页面只量到 ${consumerControls} 个组件控件，页面可能没渲染出来`
      })
    }
  } finally {
    await browser.close()
    await consumerServer.close()
    await server.close()
  }

  const errors = result.findings.filter((item) => item.severity === 'error')
  const warnings = result.findings.filter((item) => item.severity === 'warning')
  const report = {
    generatedAt: new Date().toISOString(),
    rulesVersion: AUDIT_RULES.length,
    rules: AUDIT_RULES,
    components: result.components.length,
    controls: result.components.reduce((sum, item) => sum + (item.controls ?? 0), 0),
    shots,
    focusScenes: result.focusShots,
    consumerPages,
    consumerControls,
    bigDataShot,
    errors: errors.length,
    warnings: warnings.length,
    findings: result.findings,
    componentsDetail: result.components
  }
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`)
  writeFileSync(path.join(outDir, 'index.html'), renderGallery(report), 'utf8')

  process.stdout.write(
    `视觉体检：${report.components} 个组件 / ${report.controls} 个原生控件 / ${shots} 张截图 / ` +
      `${report.consumerPages.length} 个调试台页面 ${report.consumerControls} 控件 / ` +
      `${report.bigDataShot ? '1 张大数据场景图' : '大数据场景图缺失'} / ` +
      `${report.errors} 项阻断 / ${report.warnings} 项提示\n`
  )
  for (const item of errors.slice(0, 20)) {
    process.stdout.write(`  ✗ ${item.component} [${item.rule}] ${item.detail}\n`)
  }
  if (errors.length > 20) {
    process.stdout.write(`  … 另有 ${errors.length - 20} 项，明细见 ${jsonPath}\n`)
  }
  process.stdout.write(`画廊：${path.join(outDir, 'index.html')}\n`)
  process.exit(errors.length ? 1 : 0)
}

main().catch((error) => {
  console.error('视觉体检执行失败：', error)
  process.exit(1)
})
