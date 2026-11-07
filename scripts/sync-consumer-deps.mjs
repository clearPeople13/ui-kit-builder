import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { profileCatalog } from './profile-catalog.mjs'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const consumerPkgPath = path.join(rootDir, 'examples/consumer/package.json')

/**
 * 消费方示例的 @demo 依赖由 dist/ 产物生成，不再手写（F-75）。
 * 新增一个 profile 后跑一次 npm run sync:consumer-deps，示例工程自动跟上；
 * 用例 tests/build/consumer-deps.spec.ts 会在门禁里检查两者是否一致。
 */
function main() {
  const pkg = JSON.parse(fs.readFileSync(consumerPkgPath, 'utf8'))
  const deps = Object.fromEntries(
    Object.entries(pkg.dependencies ?? {}).filter(([name]) => !name.startsWith('@demo/ui-kit-'))
  )
  for (const entry of profileCatalog(rootDir)) {
    const distPkgPath = path.join(rootDir, 'dist', entry.dirName, 'package.json')
    if (!fs.existsSync(distPkgPath)) {
      throw new Error(`缺少产物 dist/${entry.dirName}/package.json，请先跑 npm run build:all`)
    }
    const distPkg = JSON.parse(fs.readFileSync(distPkgPath, 'utf8'))
    deps[distPkg.name] = `file:../../dist/${entry.dirName}`
  }
  pkg.dependencies = Object.fromEntries(Object.entries(deps).sort(([left], [right]) => (left < right ? -1 : 1)))
  fs.writeFileSync(consumerPkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
  console.log(`[consumer] 已同步 ${Object.keys(deps).filter((name) => name.startsWith('@demo/')).length} 个 @demo 依赖`)
}

main()
