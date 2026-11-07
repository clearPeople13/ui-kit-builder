/**
 * 并行工作树的端口分配。
 *
 * 默认端口保持 5173（根 dev）/ 5174（调试台）/ 5199（浏览器巡检），主工作树行为不变；
 * 需要并行开发的工作树在仓库根放一份 `.env.workbuddy`（本地文件，不进版本库），
 * 用 UIKIT_DEV_PORT / UIKIT_CONSUMER_PORT / UIKIT_SWEEP_PORT 指定自己的端口段，
 * 两个工作树同时起 dev server 就不会抢端口。
 *
 * 命令行显式设置的环境变量优先于本地文件，方便临时换端口。
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const localFile = fileURLToPath(new URL('../.env.workbuddy', import.meta.url))
const fileEnv = {}
try {
  for (const line of readFileSync(localFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(\S+)/)
    if (match) {
      fileEnv[match[1]] = match[2]
    }
  }
} catch {
  // 主工作树没有这个文件，静默走默认值
}

function port(key, fallback) {
  const value = Number(process.env[key] ?? fileEnv[key])
  return Number.isInteger(value) && value > 0 && value < 65536 ? value : fallback
}

export const devPort = port('UIKIT_DEV_PORT', 5173)
export const consumerPort = port('UIKIT_CONSUMER_PORT', 5174)
export const sweepPort = port('UIKIT_SWEEP_PORT', 5199)
