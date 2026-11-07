import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const bin = path.join(rootDir, 'node_modules', 'vue-tsc', 'bin', 'vue-tsc.js')

const expected = [
  { line: 9, code: 'TS2353', includes: 'bgColor' },
  { line: 10, code: 'TS2353', includes: 'autoContrast' },
  { line: 11, code: 'TS2353', includes: 'gradient' },
  { line: 12, code: 'TS2353', includes: 'gradientAngle' },
  { line: 13, code: 'TS2353', includes: 'plain' },
  { line: 14, code: 'TS2353', includes: 'loading' },
  { line: 17, code: 'TS2353', includes: 'clearable' },
  { line: 20, code: 'TS2322', includes: "Type 'string'" }
]

let output = ''
let status = 0
try {
  output = execFileSync(process.execPath, [bin, '--noEmit', '--project', 'tsconfig.negative.json'], {
    cwd: rootDir,
    encoding: 'utf8'
  })
} catch (error) {
  status = error.status ?? 1
  output = `${error.stdout ?? ''}${error.stderr ?? ''}`
}

const errors = [...output.matchAll(/negative\.vue\((\d+),(\d+)\): error (TS\d+): (.*)/g)].map((match) => ({
  line: Number(match[1]),
  code: match[3],
  message: match[4]
}))

const failures = []

if (status === 0) {
  failures.push('预期 vue-tsc 报错，但检查通过了')
}

for (const item of expected) {
  const hit = errors.find(
    (error) => error.line === item.line && error.code === item.code && error.message.includes(item.includes)
  )
  if (!hit) {
    failures.push(`第 ${item.line} 行缺少 ${item.code}（${item.includes}）`)
  }
}

const unexpected = errors.filter((error) => !expected.some((item) => item.line === error.line))
for (const error of unexpected) {
  failures.push(`第 ${error.line} 行出现意外报错 ${error.code}: ${error.message}`)
}

if (failures.length) {
  console.error(`反向类型检查失败（共 ${errors.length} 条报错）:`)
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  console.error('\n实际输出:\n')
  console.error(output)
  process.exit(1)
}

console.log(`反向类型检查通过: ${errors.length} 条预期报错全部命中，对照组无报错`)
for (const error of errors) {
  console.log(`  L${error.line} ${error.code} ${error.message.slice(0, 90)}`)
}
