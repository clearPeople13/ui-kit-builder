import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildProfile, normalizePropType, sanitizeName, sanitizePrefix } from './build-lib.mjs'
import { loadRegistry } from '../registry.mjs'
import { loadThemeTokens } from './theme-tokens.mjs'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

let buildQueue = Promise.resolve()

export function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 512 * 1024) {
        reject(new Error('请求体过大'))
      }
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

const PACKAGE_LABELS = {
  core: 'Core 基础包',
  'bg-color': 'BG Color',
  gradient: 'Gradient',
  full: 'Full 全特性',
  branded: 'Branded 品牌主题',
  chinese: 'Chinese 中国风',
  cute: 'Cute 可爱主题'
}

function fsModuleUrl(file, version) {
  const normalized = file.replace(/\\/g, '/')
  return `/@fs/${normalized}?v=${version}`
}

function listPresets() {
  const profilesDir = path.join(rootDir, 'profiles')
  if (!fs.existsSync(profilesDir)) {
    return []
  }
  const presets = []
  for (const file of fs.readdirSync(profilesDir)) {
    if (!file.endsWith('.json')) {
      continue
    }
    let profile
    try {
      profile = JSON.parse(fs.readFileSync(path.join(profilesDir, file), 'utf8'))
    } catch {
      continue
    }
    const themeGlobal = profile.theme?.global && typeof profile.theme.global === 'object' ? profile.theme.global : {}
    if (!Object.keys(themeGlobal).length) {
      continue
    }
    const id = sanitizeName(profile.name ?? file.replace(/.json$/, ''))
    const palette = ['colorPrimary', 'colorSuccess', 'colorWarning', 'colorInfo']
      .map((key) => (typeof themeGlobal[key] === 'string' ? themeGlobal[key].trim() : ''))
      .filter(Boolean)
    presets.push({
      id,
      label: PACKAGE_LABELS[id] ?? id,
      theme: { global: themeGlobal },
      palette,
      tokens: Object.keys(themeGlobal).length
    })
  }
  return presets.sort((left, right) => left.id.localeCompare(right.id))
}

function listBuiltPackages() {
  const distDir = path.join(rootDir, 'dist')
  if (!fs.existsSync(distDir)) {
    return []
  }
  const packages = []
  for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    const dir = path.join(distDir, entry.name)
    const metaPath = path.join(dir, 'meta.json')
    const pkgPath = path.join(dir, 'package.json')
    if (!fs.existsSync(metaPath) || !fs.existsSync(pkgPath)) {
      continue
    }
    let meta
    let pkg
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    } catch {
      continue
    }
    const files = Array.isArray(meta.files) ? meta.files : []
    const jsFile = files.find((item) => item.file.endsWith('.js'))?.file
    if (!jsFile) {
      continue
    }
    const jsPath = path.join(dir, jsFile)
    if (!fs.existsSync(jsPath)) {
      continue
    }
    const cssFile = files.find((item) => item.file.endsWith('.css'))?.file
    const cssPath = cssFile ? path.join(dir, cssFile) : ''
    packages.push({
      id: entry.name,
      label: PACKAGE_LABELS[entry.name] ?? entry.name,
      npm: pkg.name,
      prefix: meta.prefix ?? pkg.uiKit?.prefix ?? 'ui',
      features: meta.features ?? pkg.uiKit?.features ?? [],
      componentFeatures: pkg.uiKit?.components ?? {},
      components: meta.components ?? [],
      selection: meta.selection ?? pkg.uiKit?.components ?? {},
      files,
      sizes: {
        js: meta.jsBytes ?? 0,
        css: meta.cssBytes ?? 0,
        total: meta.totalBytes ?? 0,
        gzip: meta.gzipBytes ?? 0
      },
      moduleUrl: fsModuleUrl(jsPath, Math.round(fs.statSync(jsPath).mtimeMs)),
      styleUrl: cssPath ? fsModuleUrl(cssPath, Math.round(fs.statSync(cssPath).mtimeMs)) : ''
    })
  }
  const known = Object.keys(PACKAGE_LABELS)
  packages.sort((left, right) => {
    const leftIndex = known.indexOf(left.id)
    const rightIndex = known.indexOf(right.id)
    return (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex) || left.id.localeCompare(right.id)
  })
  return packages
}

function serializeRegistry(registry) {
  return {
    name: registry.name,
    version: registry.version,
    components: registry.order.map((id) => {
      const component = registry.components[id]
      return {
        id: component.id,
        title: component.title,
        description: component.description,
        exports: component.exports.map((item) => ({
          name: item.name,
          coreProps: item.coreProps.map((prop) => ({ ...prop, type: normalizePropType(prop.type) })),
          features: Object.entries(item.features ?? {}).map(([id, feature]) => ({
            id,
            title: feature.title,
            description: feature.description,
            requires: feature.requires ?? [],
            props: (feature.props ?? []).map((prop) => ({ ...prop, type: normalizePropType(prop.type) })),
            methods: feature.methods ?? []
          }))
        }))
      }
    })
  }
}

export function apiPlugin() {
  return {
    name: 'ui-kit-build-api',
    configureServer(server) {
      server.middlewares.use('/api/registry', async (request, response) => {
        if (request.method !== 'GET') {
          sendJson(response, 405, { error: '只支持 GET' })
          return
        }
        try {
          const registry = await loadRegistry()
          sendJson(response, 200, { ...serializeRegistry(registry), tokens: loadThemeTokens() })
        } catch (error) {
          sendJson(response, 500, { error: error.message })
        }
      })

      server.middlewares.use('/api/packages', (request, response) => {
        if (request.method !== 'GET') {
          sendJson(response, 405, { error: '只支持 GET' })
          return
        }
        sendJson(response, 200, { packages: listBuiltPackages() })
      })

      server.middlewares.use('/api/presets', (request, response) => {
        if (request.method !== 'GET') {
          sendJson(response, 405, { error: '只支持 GET' })
          return
        }
        sendJson(response, 200, { presets: listPresets() })
      })

      server.middlewares.use('/api/estimate', async (request, response) => {
        if (request.method !== 'POST') {
          sendJson(response, 405, { error: '只支持 POST' })
          return
        }

        let payload
        try {
          payload = JSON.parse(await readBody(request))
        } catch {
          sendJson(response, 400, { error: '请求 JSON 无法解析' })
          return
        }

        const body = payload && typeof payload === 'object' ? payload : {}
        const selection = body.components && typeof body.components === 'object' ? body.components : {}
        if (!Object.keys(selection).length) {
          sendJson(response, 200, { components: 0, features: 0, jsBytes: 0, cssBytes: 0, totalBytes: 0, gzipBytes: 0 })
          return
        }
        const task = buildQueue.then(() =>
          buildProfile({
            name: 'estimate-internal',
            prefix: 'ui',
            theme: body.theme && typeof body.theme === 'object' ? body.theme : {},
            selection,
            logLevel: 'silent',
            outDir: '.build/estimate-dist'
          })
        )
        buildQueue = task.catch(() => {})

        try {
          const result = await task
          sendJson(response, 200, {
            components: result.components.length,
            features: result.features.length,
            jsBytes: result.jsBytes,
            cssBytes: result.cssBytes,
            totalBytes: result.totalBytes,
            gzipBytes: result.gzipBytes
          })
        } catch (error) {
          sendJson(response, error.status || 500, { error: error.message })
        }
      })

      server.middlewares.use('/api/build', async (request, response) => {
        if (request.method !== 'POST') {
          sendJson(response, 405, { error: '只支持 POST' })
          return
        }

        let payload
        try {
          payload = JSON.parse(await readBody(request))
        } catch {
          sendJson(response, 400, { error: '请求 JSON 无法解析' })
          return
        }

        const body = payload && typeof payload === 'object' ? payload : {}
        const name = typeof body.name === 'string' ? body.name : 'custom'
        const task = buildQueue.then(() =>
          buildProfile({
            name,
            prefix: typeof body.prefix === 'string' ? body.prefix : 'ui',
            theme: body.theme && typeof body.theme === 'object' ? body.theme : {},
            selection: body.components,
            features: Array.isArray(body.features) ? body.features : [],
            logLevel: 'silent'
          })
        )
        buildQueue = task.catch(() => {})

        try {
          const result = await task
          const types = fs.readFileSync(path.join(rootDir, result.dir, 'index.d.ts'), 'utf8')
          console.log(
            `[build] ${result.dir} <- ${result.components.length} components / ${result.features.length} features`
          )
          sendJson(response, 200, { ...result, types })
        } catch (error) {
          sendJson(response, error.status || 500, { error: error.message })
        }
      })
    }
  }
}
