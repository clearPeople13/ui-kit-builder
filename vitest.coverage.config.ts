import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config'
import base from './vitest.config'

/**
 * 覆盖率层：与 `npm test` 跑同一批组件用例，但把 `@ui-kit-full` 指向
 * `.build/full/entry.ts`（源码入口）而不是 `dist/full/ui-kit.js`。
 *
 * 为什么不能直接给主配置开 --coverage：
 * 主配置加载的是打包产物，V8 只能统计到那一个 bundle 文件的行覆盖，
 * 分不出"哪个组件没被测到"，数字好看但没有可行动性。
 * full profile 下产物与源码行为一致（前缀同为 `ui-`、特性全开），
 * 所以同一批用例可以在源码上重放，覆盖到 `packages/ui-kit/src/**`；
 * `npm run test:coverage` 同时也成了"源码与产物行为同构"的旁证。
 *
 * `coverage.include` 让没被任何用例 import 的源文件也计入分母——
 * 否则删掉一个组件的用例，覆盖率反而会上升（分母也少了）。
 * （vitest 4 移除了 `all` 选项：定义 include 即等价于旧 `all: true` 的行为。）
 */
export default mergeConfig(
  // vitest 5（Vite 7 类型）下 mergeConfig 泛型无法推断 defineConfig 的函数交叉类型，显式标注 UserConfig
  base as ViteUserConfig,
  defineConfig({
    resolve: {
      alias: {
        '@ui-kit-full': fileURLToPath(new URL('./.build/full/entry.ts', import.meta.url))
      }
    },
    test: {
      include: ['tests/components/**/*.spec.ts', 'tests/findings.spec.ts'],
      testTimeout: 15000,
      coverage: {
        provider: 'v8',
        // vitest 4 起 coverage.all 被移除：只要定义了 include，匹配到的已覆盖与未覆盖文件都会计入
        include: ['packages/ui-kit/src/**/*.ts'],
        exclude: ['packages/ui-kit/src/**/*.d.ts'],
        reporter: ['text', 'json-summary'],
        reportsDirectory: 'coverage',
        // 阈值只允许往上走：新增没带用例的代码会把总比例拉下来，门禁当场变红。
        // 基线（2026-11-07 首次全量测量，1570 条用例全过）：
        //   statements 88.35% / branches 84.78% / functions 89.20% / lines 88.35%
        // B4 起全局各 +1（88 / 84 / 89 / 88），仍贴着实测值，抖动余量 <1 点。
        // A20（vitest 3→5）：v4 起 module runner + ast-v8-to-istanbul 换代，
        // 同一批用例的 v8 测量值系统性下移（分支归因显著变严），已用隔离对照确认
        // 产品行为无变化（同代码同用例：v3 实测 88.24 / 84.80 / 89.43 / 88.24，
        // v5 实测 81.60 / 74.93 / 88.29 / 81.52）。按"贴着实测值"惯例重设基线：
        thresholds: {
          statements: 81,
          branches: 74,
          functions: 88,
          lines: 81,
          // 组件级下限：取当前实测最小值向下取整（tree draggable 7.01% / branches 3.84%），
          // 任一组件文件跌破就失败；等低覆盖清单逐项补齐后再抬线（B4）。
          // A20 重基线：v5 测量下组件级 branches 实测最小为 0，该项暂时形同虚设，
          // 全局 branches 阈值仍兜底；补齐低覆盖后应优先抬回组件级 branches 线。
          'packages/ui-kit/src/components/**': {
            statements: 7,
            branches: 0,
            lines: 7
          }
        }
      }
    }
  }) as ViteUserConfig
)
