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
    // 每个用例文件各自起一个 Chromium，拼的是"16 个文件 × 单文件 3–5s"的串行墙钟。
    // 16 个文件串行要 46s，真正占满 CPU 的时间不到一半，其余都在等浏览器启动 / 等待帧。
    // 并发放到 3 路：单个 Chromium 常驻约 300–500MB，本机 32GB 足够；
    // 探针服务由 globalSetup 统一拉一个随机高位端口，worker 之间共享，不会抢端口。
    // Firefox 子集（network.proxy.type=0）自成一条 file，同样受益。
    fileParallelism: true,
    maxWorkers: 3,
    testTimeout: 60000,
    hookTimeout: 120000,
    reporters: ['default']
  }
})
