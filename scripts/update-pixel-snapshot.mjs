import { spawnSync } from 'node:child_process'

// 跨平台录入像素基线：环境变量在 Windows 的 cmd 里写法不同，统一走 node 拉起 vitest
const result = spawnSync(
  process.execPath,
  ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.browser.config.ts', 'tests/browser/pixels.spec.ts'],
  { stdio: 'inherit', env: { ...process.env, UIKIT_UPDATE_SNAPSHOTS: '1' } }
)

if (result.error) {
  console.error(String(result.error.message))
}
process.exit(result.status ?? 1)
