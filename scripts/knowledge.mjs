import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { loadRegistry } from '../registry.mjs'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const knowledgeDir = path.join(rootDir, 'knowledge')
const graphFile = path.join(knowledgeDir, 'graph.json')
const readmeFile = path.join(knowledgeDir, 'README.md')

const DOC_FILES = [
  'AGENTS.md',
  'RULES.md',
  'WORKFLOW.md',
  'NAMING.md',
  'KNOWLEDGE.md',
  'REQUIREMENTS.md',
  'README.md',
  'CHANGELOG.md',
  'AOCI.md',
  'OPTIMIZATION_PLAN.md',
  'OPTIMIZATION_PLAN_V2.md',
  'OPTIMIZATION_PLAN_V3.md',
  'QODER.md'
]

function relative(file) {
  return path.relative(rootDir, file).replace(/\\/g, '/')
}

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function walk(dir, options = {}) {
  if (!fs.existsSync(dir)) {
    return []
  }
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (options.skip?.includes(entry.name)) {
      continue
    }
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(full, options))
    } else if (!options.extensions || options.extensions.has(path.extname(entry.name))) {
      files.push(full)
    }
  }
  return files.sort((left, right) => left.localeCompare(right))
}

function firstComment(file) {
  const text = read(file)
  if (path.extname(file) === '.md') {
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('<!--')) {
        return trimmed.slice(0, 180)
      }
    }
    return ''
  }
  const block = text.match(/^\s*\/\*([\s\S]*?)\*\//)
  if (block) {
    const line = block[1]
      .split(/\r?\n/)
      .map((item) => item.replace(/^\s*\*?\s?/, '').trim())
      .find(Boolean)
    return line ? line.slice(0, 180) : ''
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }
    if (trimmed.startsWith('//')) {
      return trimmed.replace(/^\/\/\s?/, '').slice(0, 180)
    }
    if (trimmed.startsWith('/*')) {
      return trimmed
        .replace(/^\/\*\s?/, '')
        .replace(/\*\/$/, '')
        .slice(0, 180)
    }
    break
  }
  return ''
}

function countLines(file) {
  const text = read(file)
  if (!text) {
    return 0
  }
  return text.split(/\r?\n/).length
}

function addNode(nodes, node) {
  if (!nodes.has(node.id)) {
    nodes.set(node.id, {
      id: node.id,
      type: node.type,
      label: node.label,
      summary: node.summary ?? '',
      path: node.path,
      tags: node.tags ?? [],
      meta: node.meta
    })
  }
}

function makeGraph() {
  const nodes = new Map()
  const edges = []
  const edgeKeys = new Set()

  function addEdge(from, to, type) {
    const key = `${from}\u0000${to}\u0000${type}`
    if (edgeKeys.has(key)) {
      return
    }
    edgeKeys.add(key)
    edges.push({ from, to, type })
  }

  function addFileNode(file, type = 'file') {
    const id = `file:${relative(file)}`
    addNode(nodes, {
      id,
      type,
      label: relative(file),
      summary: firstComment(file),
      path: relative(file),
      tags: [path.extname(file).slice(1) || 'file'],
      meta: { lines: countLines(file) }
    })
    return id
  }

  return { nodes, edges, addEdge, addFileNode }
}

async function build() {
  const registry = await loadRegistry()
  const { nodes, edges, addEdge, addFileNode } = makeGraph()

  addNode(nodes, {
    id: 'registry',
    type: 'registry',
    label: 'registry.mjs',
    summary: '组件与特性的唯一注册表；spec.mjs 是组件导出/属性/插槽/特性的声明事实源',
    path: 'registry.mjs',
    tags: ['registry', 'single-source']
  })

  addNode(nodes, {
    id: 'component-registry',
    type: 'registry',
    label: 'packages/ui-kit/src/components',
    summary: '组件源码根目录，每个组件一个目录，包含 core.ts、core.css、spec.mjs 与 features/',
    path: 'packages/ui-kit/src/components',
    tags: ['source']
  })
  addEdge('registry', 'component-registry', 'declares')

  const features = new Map()
  const componentIds = new Set(registry.order)

  for (const componentId of registry.order) {
    const component = registry.components[componentId]
    const componentNodeId = `component:${componentId}`
    const moduleFiles = new Set()

    addNode(nodes, {
      id: componentNodeId,
      type: 'component',
      label: component.title ?? componentId,
      summary: component.description ?? '',
      path: `packages/ui-kit/src/components/${componentId}`,
      tags: [componentId, 'component'],
      meta: {
        order: component.order,
        exports: component.exports.length,
        features: new Set(component.exports.flatMap((item) => Object.keys(item.features ?? {}))).size
      }
    })
    addEdge('registry', componentNodeId, 'declares')

    const specFile = path.join(rootDir, 'packages/ui-kit/src/components', componentId, 'spec.mjs')
    if (fs.existsSync(specFile)) {
      const specNode = addFileNode(specFile, 'spec')
      addEdge(componentNodeId, specNode, 'specified-by')
    }

    for (const item of component.exports) {
      const exportNodeId = `export:${componentId}.${item.name}`
      addNode(nodes, {
        id: exportNodeId,
        type: 'export',
        label: `${component.title ?? componentId} / ${item.name}`,
        summary: item.description ?? component.description ?? '',
        path: item.module,
        tags: [componentId, item.name, 'export'],
        meta: {
          coreProps: item.coreProps?.length ?? 0,
          slots: item.slots?.length ?? 0,
          features: Object.keys(item.features ?? {}).length
        }
      })
      addEdge(componentNodeId, exportNodeId, 'exports')
      if (item.module && fs.existsSync(path.join(rootDir, item.module))) {
        moduleFiles.add(item.module)
        const fileNode = addFileNode(path.join(rootDir, item.module))
        addEdge(exportNodeId, fileNode, 'defined-in')
      }

      for (const prop of item.coreProps ?? []) {
        const propNodeId = `prop:${componentId}.${item.name}.${prop.name}`
        addNode(nodes, {
          id: propNodeId,
          type: 'prop',
          label: `${item.name}.${prop.name}`,
          summary: prop.description ?? '',
          path: item.module,
          tags: [componentId, item.name, prop.name, 'prop'],
          meta: { type: prop.type, default: prop.default }
        })
        addEdge(exportNodeId, propNodeId, 'has-prop')
      }

      for (const slot of item.slots ?? []) {
        const slotNodeId = `slot:${componentId}.${item.name}.${slot.name}`
        addNode(nodes, {
          id: slotNodeId,
          type: 'slot',
          label: `${item.name} #${slot.name}`,
          summary: slot.description ?? '',
          path: item.module,
          tags: [componentId, item.name, slot.name, 'slot'],
          meta: { fallback: slot.fallback, renderedVia: slot.renderedVia }
        })
        addEdge(exportNodeId, slotNodeId, 'has-slot')
      }

      for (const [featureId, feature] of Object.entries(item.features ?? {})) {
        const featureNodeId = `feature:${featureId}`
        const previous = features.get(featureId)
        features.set(featureId, {
          ...feature,
          id: featureId,
          componentId,
          requires: [...new Set([...(previous?.requires ?? []), ...(feature.requires ?? [])])]
        })
        addNode(nodes, {
          id: featureNodeId,
          type: 'feature',
          label: `${feature.title ?? featureId} (${featureId})`,
          summary: feature.description ?? '',
          path: feature.module,
          tags: [componentId, featureId, 'feature'],
          meta: {
            props: feature.props?.length ?? 0,
            requires: feature.requires ?? []
          }
        })
        addEdge(exportNodeId, featureNodeId, 'has-feature')
        addEdge(componentNodeId, featureNodeId, 'has-feature')
        if (feature.module && fs.existsSync(path.join(rootDir, feature.module))) {
          moduleFiles.add(feature.module)
          const fileNode = addFileNode(path.join(rootDir, feature.module))
          addEdge(featureNodeId, fileNode, 'defined-in')
        }
        for (const prop of feature.props ?? []) {
          const propNodeId = `prop:${componentId}.${featureId}.${prop.name}`
          addNode(nodes, {
            id: propNodeId,
            type: 'prop',
            label: `${featureId}.${prop.name}`,
            summary: prop.description ?? '',
            path: feature.module,
            tags: [componentId, featureId, prop.name, 'prop'],
            meta: { type: prop.type, default: prop.default }
          })
          addEdge(featureNodeId, propNodeId, 'has-prop')
        }
      }
    }

    for (const item of moduleFiles) {
      addEdge(componentNodeId, `file:${item}`, 'implemented-by')
    }
  }

  for (const feature of features.values()) {
    for (const dependency of feature.requires ?? []) {
      if (features.has(dependency)) {
        addEdge(`feature:${feature.id}`, `feature:${dependency}`, 'requires')
      }
    }
  }

  const sourceFiles = walk(path.join(rootDir, 'packages/ui-kit/src'), {
    extensions: new Set(['.ts', '.css', '.mjs'])
  })
  for (const file of sourceFiles) {
    addFileNode(file)
  }
  for (const file of walk(path.join(rootDir, 'scripts'), { extensions: new Set(['.mjs']) })) {
    const nodeId = addFileNode(file, 'script')
    addNode(nodes, {
      id: `script:${path.basename(file)}`,
      type: 'script',
      label: path.basename(file),
      summary: firstComment(file),
      path: relative(file),
      tags: ['script'],
      meta: { lines: countLines(file) }
    })
    addEdge(`script:${path.basename(file)}`, nodeId, 'defined-in')
  }

  for (const file of walk(path.join(rootDir, 'tests'), {
    extensions: new Set(['.ts'])
  })) {
    const base = path.basename(file, '.spec.ts')
    const relativePath = relative(file)
    const isBrowser = relativePath.startsWith('tests/browser/')
    const isBuild = relativePath.startsWith('tests/build/')
    const isProfiles = relativePath.startsWith('tests/profiles/')
    const isCoverage = relativePath.startsWith('tests/coverage/')
    const testNodeId = `test:${relativePath}`
    addNode(nodes, {
      id: testNodeId,
      type: 'test',
      label: relativePath,
      summary: firstComment(file),
      path: relativePath,
      tags: [
        isBrowser ? 'browser' : isBuild ? 'build' : isProfiles ? 'profiles' : isCoverage ? 'coverage' : 'component'
      ],
      meta: { lines: countLines(file) }
    })
    if (!isBrowser && !isBuild && !isProfiles && !isCoverage && componentIds.has(base)) {
      addEdge(testNodeId, `component:${base}`, 'tests')
    } else if (isBrowser && componentIds.has(base)) {
      addEdge(testNodeId, `component:${base}`, 'tests')
    }
  }

  for (const file of walk(path.join(rootDir, '.githooks'), { extensions: new Set(['']) })) {
    const name = path.basename(file)
    const nodeId = `hook:${name}`
    addNode(nodes, {
      id: nodeId,
      type: 'hook',
      label: name,
      summary: firstComment(file),
      path: relative(file),
      tags: ['hook', 'git'],
      meta: { lines: countLines(file) }
    })
    const text = read(file)
    const script = text.match(/node\s+(scripts\/[^\s"']+)/)
    if (script) {
      addEdge(nodeId, `script:${path.basename(script[1])}`, 'runs')
    }
  }

  for (const file of walk(path.join(rootDir, 'profiles'), { extensions: new Set(['.json']) })) {
    const profile = JSON.parse(read(file))
    const name = profile.name ?? path.basename(file, '.json')
    addNode(nodes, {
      id: `profile:${name}`,
      type: 'profile',
      label: profile.label ?? name,
      summary: `构建配置：components=${profile.components ?? 'unknown'}${profile.prefix ? `，prefix=${profile.prefix}` : ''}`,
      path: relative(file),
      tags: ['profile', name, profile.prefix].filter(Boolean),
      meta: {
        order: profile.order,
        components: profile.components,
        prefix: profile.prefix,
        theme: Boolean(profile.theme)
      }
    })
    addEdge(`profile:${name}`, 'registry', 'selects-from')
  }

  for (const file of DOC_FILES) {
    const full = path.join(rootDir, file)
    if (!fs.existsSync(full)) {
      continue
    }
    const docId = `doc:${file}`
    addNode(nodes, {
      id: docId,
      type: 'doc',
      label: file,
      summary: firstComment(full),
      path: file,
      tags: ['doc'],
      meta: { lines: countLines(full) }
    })
    const lines = read(full).split(/\r?\n/)
    let sectionIndex = 0
    let current = null
    const flush = () => {
      if (!current) {
        return
      }
      const text = current.lines.join('\n').trim()
      const sectionId = `doc:${file}#${current.index}`
      addNode(nodes, {
        id: sectionId,
        type: 'doc-section',
        label: current.title,
        summary: text.slice(0, 220),
        path: `${file}#${current.index}`,
        tags: ['doc', current.level === 2 ? 'section' : 'subsection'],
        meta: { level: current.level }
      })
      addEdge(docId, sectionId, 'contains')
      for (const componentId of componentIds) {
        const component = registry.components[componentId]
        const title = String(component.title ?? '').split(/\s+/)[0]
        if (new RegExp(`(^|[^a-zA-Z0-9])${componentId}([^a-zA-Z0-9]|$)`).test(text)) {
          addEdge(sectionId, `component:${componentId}`, 'mentions')
        } else if (title.length >= 2 && text.includes(title)) {
          addEdge(sectionId, `component:${componentId}`, 'mentions')
        }
      }
      current = null
    }
    for (const line of lines) {
      const heading = line.match(/^(#{2,3})\s+(.+?)\s*$/)
      if (heading) {
        flush()
        current = {
          index: sectionIndex,
          level: heading[1].length,
          title: heading[2].replace(/[[\]]/g, ''),
          lines: []
        }
        sectionIndex += 1
      } else if (current) {
        current.lines.push(line)
      }
    }
    flush()

    const links = [...read(full).matchAll(/\]\(([^)#]+\.md)(?:#[^)]*)?\)/g)]
    for (const link of links) {
      const target = `doc:${link[1].replace(/^\.\//, '')}`
      if (nodes.has(target)) {
        addEdge(docId, target, 'links')
      }
    }
  }

  const packageJson = JSON.parse(read(path.join(rootDir, 'package.json')))
  for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
    const commandId = `command:npm:${name}`
    addNode(nodes, {
      id: commandId,
      type: 'command',
      label: `npm run ${name}`,
      summary: command,
      path: 'package.json',
      tags: ['command', name],
      meta: { script: command }
    })
    const script = String(command).match(/node\s+(scripts\/[^\s"']+)/)
    if (script) {
      addEdge(commandId, `script:${path.basename(script[1])}`, 'runs')
    }
  }

  const sortedNodes = [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id))
  const nodeIds = new Set(sortedNodes.map((node) => node.id))
  const sortedEdges = edges
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to))
    .sort((left, right) => {
      const from = left.from.localeCompare(right.from)
      if (from) {
        return from
      }
      const to = left.to.localeCompare(right.to)
      return to || left.type.localeCompare(right.type)
    })
  const digest = createHash('sha256')
    .update(JSON.stringify({ nodes: sortedNodes, edges: sortedEdges }))
    .digest('hex')
    .slice(0, 16)
  const graph = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceDigest: digest,
    stats: {
      nodes: sortedNodes.length,
      edges: sortedEdges.length,
      components: sortedNodes.filter((node) => node.type === 'component').length,
      features: sortedNodes.filter((node) => node.type === 'feature').length,
      props: sortedNodes.filter((node) => node.type === 'prop').length,
      slots: sortedNodes.filter((node) => node.type === 'slot').length,
      files: sortedNodes.filter((node) => node.type === 'file').length,
      docs: sortedNodes.filter((node) => node.type === 'doc-section').length,
      tests: sortedNodes.filter((node) => node.type === 'test').length
    },
    nodes: sortedNodes,
    edges: sortedEdges
  }

  fs.mkdirSync(knowledgeDir, { recursive: true })
  fs.writeFileSync(graphFile, `${JSON.stringify(graph, null, 2)}\n`, 'utf8')
  fs.writeFileSync(readmeFile, renderReadme(graph, registry), 'utf8')
  console.log(
    `知识图谱已生成：${relative(graphFile)}（${graph.stats.nodes} 节点 / ${graph.stats.edges} 边，digest ${graph.sourceDigest}）`
  )
}

function renderReadme(graph, registry) {
  const componentNodes = graph.nodes.filter((node) => node.type === 'component')
  const featureNodes = graph.nodes.filter((node) => node.type === 'feature')
  const profileNodes = graph.nodes.filter((node) => node.type === 'profile')
  const docNodes = graph.nodes.filter((node) => node.type === 'doc')
  const lines = [
    '# 项目知识图谱',
    '',
    '> 由 `npm run knowledge:build` 从 `registry.mjs`、各组件 `spec.mjs`、profiles、文档、测试与脚本生成；不要手改。',
    `> 当前 digest：\`${graph.sourceDigest}\`（节点 ${graph.stats.nodes} / 边 ${graph.stats.edges}）。`,
    '',
    '## 快速检索',
    '',
    '```bash',
    'npm run knowledge:search -- "虚拟滚动"',
    'npm run knowledge:search -- "table edge" --json',
    'npm run knowledge:explain -- component:table',
    'npm run knowledge:stats',
    '```',
    '',
    '节点 id 约定：`component:<id>`、`export:<component>.<export>`、`feature:<component>.<feature>`、`profile:<name>`、`doc:<file>#<section>`、`test:<path>`、`command:npm:<name>`。',
    '',
    '## 组件索引',
    '',
    '| 组件 | 说明 | 导出 | 特性 |',
    '| --- | --- | --- | --- |',
    ...componentNodes.map((node) => {
      const component = registry.components[node.id.slice('component:'.length)]
      const featureCount = componentNodes.length
        ? featureNodes.filter((feature) => feature.tags.includes(component?.id ?? '')).length
        : 0
      return `| \`${component?.id ?? node.id}\` | ${(node.summary || '').replace(/\|/g, '\\|')} | ${node.meta?.exports ?? ''} | ${featureCount} |`
    }),
    '',
    '## profile',
    '',
    '| id | 标签 | 组件范围 | 前缀 |',
    '| --- | --- | --- | --- |',
    ...profileNodes.map((node) => {
      return `| \`${node.id}\` | ${node.label} | ${node.meta?.components ?? ''} | ${node.meta?.prefix ?? ''} |`
    }),
    '',
    '## 文档',
    '',
    ...docNodes.map((node) => `- \`${node.path}\`：${node.summary || node.label}`),
    ''
  ]
  return `${lines.join('\n')}\n`
}

function loadGraph() {
  if (!fs.existsSync(graphFile)) {
    throw new Error('知识图谱不存在，请先运行 npm run knowledge:build')
  }
  return JSON.parse(read(graphFile))
}

function scoreNode(node, tokens) {
  const haystack = [
    node.id,
    node.label,
    node.summary,
    node.path,
    ...(node.tags ?? []),
    node.meta ? JSON.stringify(node.meta) : ''
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  let score = 0
  let matched = 0
  for (const token of tokens) {
    if (!haystack.includes(token)) {
      continue
    }
    matched += 1
    if (node.id.toLowerCase() === token) {
      score += 100
    }
    if (node.label.toLowerCase() === token) {
      score += 80
    }
    if (node.id.toLowerCase().includes(token)) {
      score += 35
    }
    if (node.label.toLowerCase().includes(token)) {
      score += 25
    }
    if ((node.tags ?? []).some((tag) => String(tag).toLowerCase().includes(token))) {
      score += 20
    }
    if ((node.path ?? '').toLowerCase().includes(token)) {
      score += 15
    }
    if ((node.summary ?? '').toLowerCase().includes(token)) {
      score += 10
    }
  }
  return matched === tokens.length ? score : matched > 0 ? score / 4 : 0
}

function search(query, options) {
  const graph = loadGraph()
  const tokens = query
    .toLowerCase()
    .split(/[\s,，。:：;；/]+/)
    .filter(Boolean)
  if (!tokens.length) {
    throw new Error('搜索词不能为空')
  }
  const results = graph.nodes
    .map((node) => ({ node, score: scoreNode(node, tokens) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.node.id.localeCompare(right.node.id))
    .slice(0, options.limit)
  const outgoing = new Map()
  for (const edge of graph.edges) {
    if (!outgoing.has(edge.from)) {
      outgoing.set(edge.from, [])
    }
    outgoing.get(edge.from).push(edge)
  }
  if (options.json) {
    console.log(
      JSON.stringify(
        results.map((item) => item.node),
        null,
        2
      )
    )
    return
  }
  if (!results.length) {
    console.log(`没有匹配 “${query}” 的节点。`)
    return
  }
  for (const { node, score } of results) {
    const related = (outgoing.get(node.id) ?? []).length
    console.log(`\n[${node.type}] ${node.id}  (${Math.round(score)})`)
    console.log(`  ${node.label}`)
    if (node.path) {
      console.log(`  path: ${node.path}`)
    }
    if (node.summary) {
      console.log(`  ${node.summary}`)
    }
    if (related) {
      console.log(`  关联边: ${related}；用 npm run knowledge:explain -- ${node.id} 展开`)
    }
  }
}

function explain(target) {
  const graph = loadGraph()
  const exact = graph.nodes.find((node) => node.id === target)
  const candidates = exact
    ? [exact]
    : graph.nodes
        .filter((node) => node.id.includes(target) || node.label.toLowerCase().includes(target.toLowerCase()))
        .slice(0, 20)
  if (!candidates.length) {
    console.log(`没有找到节点 “${target}”。`)
    return
  }
  if (candidates.length > 1) {
    console.log(`匹配到 ${candidates.length} 个节点，请用更精确的 id：`)
    for (const node of candidates) {
      console.log(`  [${node.type}] ${node.id}  ${node.label}`)
    }
    return
  }
  const node = candidates[0]
  console.log(`[${node.type}] ${node.id}`)
  console.log(`  label: ${node.label}`)
  if (node.path) {
    console.log(`  path: ${node.path}`)
  }
  if (node.summary) {
    console.log(`  summary: ${node.summary}`)
  }
  if (node.tags?.length) {
    console.log(`  tags: ${node.tags.join(', ')}`)
  }
  if (node.meta) {
    console.log(`  meta: ${JSON.stringify(node.meta)}`)
  }
  const nodeById = new Map(graph.nodes.map((item) => [item.id, item]))
  for (const direction of ['out', 'in']) {
    const edges = graph.edges.filter((edge) => (direction === 'out' ? edge.from : edge.to) === node.id)
    if (!edges.length) {
      continue
    }
    console.log(`\n${direction === 'out' ? '出边' : '入边'}（${edges.length}）：`)
    for (const edge of edges) {
      const other = nodeById.get(direction === 'out' ? edge.to : edge.from)
      console.log(`  ${edge.type} -> [${other?.type ?? '?'}] ${other?.id ?? '?'}  ${other?.label ?? ''}`)
    }
  }
}

function stats() {
  const graph = loadGraph()
  console.log(
    JSON.stringify({ ...graph.stats, sourceDigest: graph.sourceDigest, generatedAt: graph.generatedAt }, null, 2)
  )
}

const [command = 'help', ...rest] = process.argv.slice(2)
try {
  if (command === 'build') {
    await build()
  } else if (command === 'search') {
    const json = rest.includes('--json')
    const limitIndex = rest.indexOf('--limit')
    const limit = limitIndex >= 0 ? Number(rest[limitIndex + 1]) || 20 : 20
    const query = rest.filter((item) => item !== '--json' && item !== '--limit' && item !== String(limit)).join(' ')
    search(query, { json, limit })
  } else if (command === 'explain') {
    explain(rest[0] ?? '')
  } else if (command === 'stats') {
    stats()
  } else {
    console.log(`用法：
  node scripts/knowledge.mjs build
  node scripts/knowledge.mjs search "<关键词>" [--json] [--limit 20]
  node scripts/knowledge.mjs explain <节点 id>
  node scripts/knowledge.mjs stats`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
