import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sanitizeName } from './build-lib.mjs'

const defaultRootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

/**
 * profiles/*.json 是 profile 清单的唯一来源（F-73）。
 *
 * 构建器、调试台元数据、dev API 都从这里读，不再各维护一份硬编码数组：
 * 新增一个 profile 只需要加一个 JSON（带 label），再跑 npm run build:all 与 npm run sync:consumer-deps。
 * 顺序按 profile 里的 order 字段（缺省按文件名），保证构建输出、sizes.json 与 UI 列表三处一致；
 * order 保留"core → full → 主题"的档位递进语义，verify 的体积档位断言依赖它。
 */
export function profileCatalog(rootDir = defaultRootDir) {
  const dir = path.join(rootDir, 'profiles')
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((fileName) => {
      const config = JSON.parse(fs.readFileSync(path.join(dir, fileName), 'utf8'))
      return {
        fileName,
        profileName: fileName.replace(/\.json$/, ''),
        dirName: sanitizeName(config.name ?? fileName),
        label: config.label ?? config.name ?? fileName,
        order: typeof config.order === 'number' ? config.order : 999,
        config
      }
    })
    .sort((left, right) => left.order - right.order || left.fileName.localeCompare(right.fileName))
}
