import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// 测试对象是构建产物 dist/full/ui-kit.js，与消费方 examples/consumer 的引用方式保持一致：
// 用例覆盖的是"打包后真正被使用的那份代码"，特性开关全开的完整版
export default defineConfig({
  resolve: {
    alias: {
      '@ui-kit-full': fileURLToPath(new URL('./dist/full/ui-kit.js', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.spec.ts'],
    testTimeout: 15000,
    reporters: ['default']
  }
})
