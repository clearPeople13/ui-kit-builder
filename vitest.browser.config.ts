import { defineConfig } from 'vitest/config'

/**
 * 第四批：真实浏览器层用例的独立入口。
 *
 * happy-dom 里所有矩形恒为 0、没有合成器、没有真实焦点链，
 * 浮层贴边翻转、列宽拖拽、色板拖拽、虚拟滚动、键盘可达性这些"只有真浏览器能证"的行为
 * 只能在 Chromium 里跑。globalSetup 会拉起一个以仓库根为 root 的静态 Vite 服务，
 * 用例通过 Playwright 打开 tests/browser/harness/index.html?scene=<name>。
 *
 * 必须先有 dist/full 产物（package.json 的 pretest:browser 已挂钩）。
 * 浏览器用例每条都要启动 Chromium，串行执行以免同时开十几个进程。
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/browser/**/*.spec.ts'],
    globalSetup: ['./tests/browser/_global-setup.ts'],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 120000,
    reporters: ['default']
  }
})
