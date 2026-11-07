import type { Browser, Download, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * 构建器 UI 的浏览器层安全网（B1）。
 *
 * configurator/ 有 2584 行前端逻辑，此前连"能不能打开"都没有用例。
 * 这里复用浏览器层的 Vite 服务（globalSetup 已挂 apiPlugin），只覆盖四条主干：
 * 入口跳转、组件数、选 2 个组件的真实试算、构建产物与配置下载。
 */

let browser: Browser
let page: Page
const messages: string[] = []

const origin = new URL(process.env.UIKIT_HARNESS_BASE!).origin

beforeAll(async () => {
  browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  page = await context.newPage()
  page.on('console', (entry) => {
    if (entry.type() === 'warning' || entry.type() === 'error') {
      messages.push(`[${entry.type()}] ${entry.text()}`)
    }
  })
  page.on('pageerror', (error) => messages.push(`[pageerror] ${error.message}`))

  // 从仓库根入口进入，验证 index.html 的 meta refresh 能落到构建器
  await page.goto(`${origin}/`, { waitUntil: 'load' })
  await page.waitForURL(/\/configurator\/$/)
  await page.waitForFunction(() => document.querySelector('#component-total')?.textContent === '90', undefined, {
    timeout: 30_000
  })
})

afterAll(async () => {
  await browser?.close()
})

describe('构建器 UI · 浏览器层', () => {
  it('根入口跳转到构建器，并渲染出四步标题', async () => {
    expect(await page.title()).toContain('UI Kit 按需构建器')
    for (const id of ['step-components', 'step-features', 'step-theme', 'step-build']) {
      expect(await page.locator(`#${id}`).isVisible(), `${id} 应可见`).toBe(true)
    }
  })

  it('组件清单完整渲染 90 个组件', async () => {
    expect(await page.locator('#component-total').textContent()).toBe('90')
    expect(await page.locator('#component-list .component').count()).toBe(90)
    expect(messages).toEqual([])
  })

  it('选 2 个组件后自动试算，体积为正数', async () => {
    await page.locator('#presets button[data-preset="none"]').click()
    for (const id of ['button', 'tag']) {
      await page.locator(`details[data-component="${id}"] input.component__check`).check()
    }
    await page.waitForFunction(
      () => {
        const badge = document.querySelector('#estimate-badge')?.textContent ?? ''
        return badge === '试算完成' || badge === '构建实测'
      },
      undefined,
      { timeout: 30_000 }
    )
    const note = await page.locator('#estimate-note').textContent()
    expect(note, '试算结果应基于刚选的 2 个组件').toContain('2 个组件')
    const numbers = await page.locator('#estimate-numbers').textContent()
    expect(numbers, '体积应给出正数（不是 0 B）').toMatch(/\d+(\.\d+)?\s*kB/)
  })

  it('生成包后展示产物路径与文件清单', async () => {
    await page.locator('#package-suffix').fill('browser-spec')
    await page.locator('#build-button').click()
    await page.waitForFunction(
      () => document.querySelector('#build-output')?.className.includes('output--success') === true,
      undefined,
      { timeout: 30_000 }
    )
    const output = await page.locator('#build-output').textContent()
    expect(output).toContain('构建成功')
    expect(output).toContain('dist/custom/browser-spec')
    expect(output).toContain('ui-kit.js')
  })

  it('构建配置可以下载', async () => {
    const downloadPromise = page.waitForEvent('download')
    await page.locator('#download-config').click()
    const download: Download = await downloadPromise
    expect(download.suggestedFilename()).toBe('build.config.json')
  })
})
