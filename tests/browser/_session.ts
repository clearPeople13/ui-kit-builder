import type { Browser, ConsoleMessage, Page } from 'playwright'
import { chromium } from 'playwright'

export type Session = {
  browser: Browser
  page: Page
  /** 页面里出现过的 console 输出与未捕获异常，控制台归零的断言就看这份清单 */
  messages: string[]
  scene: string
  close: () => Promise<void>
}

/**
 * 打开一个场景页并等它真正绘制完（探针页在两帧之后把 __probe.ready 置真）。
 * viewport 固定 1280×720，让"贴边翻转"这类断言有确定的坐标系。
 */
export async function openScene(
  scene: string,
  options: { viewport?: { width: number; height: number } } = {}
): Promise<Session> {
  const base = process.env.UIKIT_HARNESS_BASE
  if (!base) {
    throw new Error('浏览器层缺少 UIKIT_HARNESS_BASE，请通过 vitest.browser.config.ts 的 globalSetup 运行')
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: options.viewport ?? { width: 1280, height: 720 } })
  const page = await context.newPage()
  const messages: string[] = []

  page.on('console', (entry: ConsoleMessage) => {
    if (entry.type() === 'warning' || entry.type() === 'error') {
      messages.push(`[${entry.type()}] ${entry.text()}`)
    }
  })
  page.on('pageerror', (error) => {
    messages.push(`[pageerror] ${error.message}`)
  })

  await page.goto(`${base}?scene=${scene}`, { waitUntil: 'load' })
  await page.waitForFunction(
    () => (window as unknown as { __probe?: { ready?: boolean } }).__probe?.ready === true,
    undefined,
    {
      timeout: 30_000
    }
  )

  return {
    browser,
    page,
    messages,
    scene,
    close: async () => {
      await context.close()
      await browser.close()
    }
  }
}

export type Box = {
  x: number
  y: number
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

/** 视口相对坐标；元素不存在直接抛错，免得用例里到处判空 */
export async function rect(page: Page, selector: string): Promise<Box> {
  return page.evaluate((target) => {
    const element = document.querySelector(target)
    if (!element) {
      throw new Error(`找不到元素：${target}`)
    }
    const box = element.getBoundingClientRect()
    return {
      x: box.x,
      y: box.y,
      left: box.left,
      top: box.top,
      right: box.right,
      bottom: box.bottom,
      width: box.width,
      height: box.height
    }
  }, selector)
}

export async function viewport(page: Page) {
  return page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight, scrollY: window.scrollY }))
}

export function probeValue<T = unknown>(page: Page, key: string): Promise<T | undefined> {
  return page.evaluate((name) => (window as unknown as { __probe?: Record<string, any> }).__probe?.[name] as T, key)
}

/** 元素是否存在（面板全部 teleport 到 body，用例必须按 popperClass 精确选中实例） */
export function hasElement(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((target) => Boolean(document.querySelector(target)), selector)
}

export function classListOf(page: Page, selector: string): Promise<string> {
  return page.evaluate((target) => document.querySelector(target)?.className ?? '', selector)
}

export function countOf(page: Page, selector: string): Promise<number> {
  return page.evaluate((target) => document.querySelectorAll(target).length, selector)
}

/** 直接移动鼠标到元素中心：page.hover 会先把元素滚进视口，滚动跟随类断言会被它带偏 */
export async function moveToCenter(page: Page, selector: string, offsetX = 0, offsetY = 0): Promise<void> {
  const box = await page.evaluate((target) => {
    const element = document.querySelector(target)
    if (!element) {
      throw new Error(`找不到元素：${target}`)
    }
    const rect = element.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }, selector)
  await page.mouse.move(box.x + offsetX, box.y + offsetY)
  await page.waitForTimeout(250)
}

/** 真实滚动：只改 scrollTop，不触发 Playwright 的"滚进视口"副作用 */
export async function setScrollTop(page: Page, value: number): Promise<void> {
  await page.evaluate((top) => {
    document.documentElement.scrollTop = top
  }, value)
  await page.waitForTimeout(150)
}

export function scrollTop(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollTop)
}

/** 断言页面无告警：把清单原样贴进失败信息，便于直接定位是谁在叫 */
export function expectSilent(messages: string[], label: string) {
  const noise = messages.filter((line) => !line.includes('Download the Vue Devtools'))
  if (noise.length) {
    throw new Error(`${label} 出现 ${noise.length} 条控制台告警：\n${noise.slice(0, 20).join('\n')}`)
  }
}
