import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildProfile, normalizePropType, sanitizeName, sanitizePrefix } from './build-lib.mjs'
import { profileCatalog } from './profile-catalog.mjs'
import { loadRegistry } from '../registry.mjs'
import { loadThemeTokens } from './theme-tokens.mjs'

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

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

function profileEntries() {
  return profileCatalog(rootDir)
}

const PACK_MIME_TYPES = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
}

function serveRawPackFile(request, response) {
  const urlPath = decodeURIComponent((request.url ?? '').split('?')[0])
  const relative = urlPath.replace(/^\/packs\//, '')
  const segments = relative.split('/').filter(Boolean)
  const [packId, ...fileParts] = segments
  const fileName = fileParts.join('/')
  if (!packId || !fileName || fileName.includes('..')) {
    response.statusCode = 400
    response.end('Bad request')
    return true
  }
  const filePath = path.join(rootDir, 'dist', packId, fileName)
  const packDir = path.join(rootDir, 'dist', packId)
  if (!filePath.startsWith(packDir + path.sep) || !fs.existsSync(filePath)) {
    response.statusCode = 404
    response.end('Not found')
    return true
  }
  response.setHeader('Content-Type', PACK_MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream')
  response.end(fs.readFileSync(filePath))
  return true
}

function fsModuleUrl(file, version) {
  const normalized = file.replace(/\\/g, '/')
  return `/@fs/${normalized}?v=${version}`
}

// /@fs 会被 Vite 做 import 重写（裸 'vue' → 预构建 chunk），宿主页动态 import 需要它；
// 但 @vue/repl 的 iframe 靠 import map 解析 'vue'，重写会让套件和渲染器各用一份 Vue 副本，
// ref owner 上下文丢失，因此 iframe 必须用这份原样直出的副本。
function rawPackUrl(id, fileName, version) {
  return `/packs/${id}/${fileName}?v=${version}`
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

/**
 * 正式 profile 名来自 profiles/*.json，是保留名：自定义包不允许与其同名，
 * 否则会覆盖 dist/<profile> 这类可安装的正式产物（F-66）。
 */
export function reservedProfileNames() {
  return new Set(profileEntries().map((entry) => entry.dirName))
}

/** 自定义包统一落在 dist/custom/<name>，与 20 份正式 profile 的命名空间隔离 */
export function customPackageDir(name) {
  return `dist/custom/${sanitizeName(name)}`
}

function describePackage(dir, id, label) {
  const metaPath = path.join(dir, 'meta.json')
  const pkgPath = path.join(dir, 'package.json')
  if (!fs.existsSync(metaPath) || !fs.existsSync(pkgPath)) {
    return null
  }
  let meta
  let pkg
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  } catch {
    return null
  }
  const files = Array.isArray(meta.files) ? meta.files : []
  const jsFile = files.find((item) => item.file.endsWith('.js'))?.file
  if (!jsFile) {
    return null
  }
  const jsPath = path.join(dir, jsFile)
  if (!fs.existsSync(jsPath)) {
    return null
  }
  const cssFile = files.find((item) => item.file.endsWith('.css'))?.file
  const cssPath = cssFile ? path.join(dir, cssFile) : ''
  const jsVersion = Math.round(fs.statSync(jsPath).mtimeMs)
  const cssVersion = cssPath ? Math.round(fs.statSync(cssPath).mtimeMs) : 0
  return {
    id,
    label: label ?? meta.name ?? id,
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
    moduleUrl: fsModuleUrl(jsPath, jsVersion),
    rawModuleUrl: rawPackUrl(id, jsFile, jsVersion),
    styleUrl: cssPath ? fsModuleUrl(cssPath, cssVersion) : '',
    rawStyleUrl: cssPath ? rawPackUrl(id, cssFile, cssVersion) : ''
  }
}

function listBuiltPackages() {
  const distDir = path.join(rootDir, 'dist')
  if (!fs.existsSync(distDir)) {
    return []
  }
  const packages = []
  const catalog = profileEntries()
  const labels = new Map(catalog.map((item) => [item.dirName, item.label]))
  const order = new Map(catalog.map((item, index) => [item.dirName, index]))
  const customDir = path.join(distDir, 'custom')
  for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    // 特性边际试算的历史残留（旧版 build:all 曾把 __feat_* 写进 dist/）不该出现在包列表里
    if (entry.name.startsWith('feat-')) {
      continue
    }
    // dist/custom/<name> 是构建器 UI 的自定义包命名空间，按 custom/<name> 列出，不与正式 profile 混排
    if (entry.name === 'custom') {
      for (const custom of fs.readdirSync(customDir, { withFileTypes: true })) {
        if (!custom.isDirectory()) {
          continue
        }
        const described = describePackage(path.join(customDir, custom.name), `custom/${custom.name}`)
        if (described) {
          packages.push(described)
        }
      }
      continue
    }
    const described = describePackage(path.join(distDir, entry.name), entry.name, labels.get(entry.name))
    if (described) {
      packages.push(described)
    }
  }
  packages.sort((left, right) => {
    const leftIndex = order.has(left.id) ? order.get(left.id) : 99
    const rightIndex = order.has(right.id) ? order.get(right.id) : 99
    return leftIndex - rightIndex || left.id.localeCompare(right.id)
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

function parseBody(rawBody) {
  try {
    const payload = JSON.parse(rawBody)
    return { ok: true, value: payload && typeof payload === 'object' ? payload : {} }
  } catch {
    return { ok: false, value: {} }
  }
}

/**
 * 接口实现与 HTTP 通道分离：handler 只吃原始请求体、吐 { status, payload }，
 * 这样 node 环境可以直接覆盖正常 / 400 / 409 / 超限等分支，不必起 dev server。
 * 顺序化的 build 队列留在闭包里，同一进程内 estimate 与 build 不会互相覆盖产物。
 */
export function createApiHandlers() {
  let buildQueue = Promise.resolve()
  const enqueue = (factory) => {
    const task = buildQueue.then(factory)
    buildQueue = task.catch(() => {})
    return task
  }
  // 估算结果按"选中组件 + 主题"缓存，来回切选项时同一组合不重复打包（C11）。
  // Map 的插入顺序当 LRU 用：命中先删再插，超过上限时淘汰最旧的一条。
  const estimateCache = new Map()
  const ESTIMATE_CACHE_LIMIT = 30
  const estimateKey = (body, selection) => {
    const normalized = Object.keys(selection)
      .sort()
      .map((id) => `${id}:${(Array.isArray(selection[id]) ? [...selection[id]] : []).sort().join(',')}`)
      .join('|')
    return `${JSON.stringify(body.theme ?? {})}\n${normalized}`
  }

  return {
    async registry() {
      try {
        // dev 侧要能看到刚改过的 spec，显式绕过进程级 memo（C3）
        const registry = await loadRegistry({ fresh: true })
        return { status: 200, payload: { ...serializeRegistry(registry), tokens: loadThemeTokens() } }
      } catch (error) {
        return { status: 500, payload: { error: error.message } }
      }
    },

    packages() {
      return { status: 200, payload: { packages: listBuiltPackages() } }
    },

    presets() {
      return { status: 200, payload: { presets: listPresets() } }
    },

    async estimate(rawBody) {
      const parsed = parseBody(rawBody)
      if (!parsed.ok) {
        return { status: 400, payload: { error: '请求 JSON 无法解析' } }
      }

      const body = parsed.value
      const selection = body.components && typeof body.components === 'object' ? body.components : {}
      if (!Object.keys(selection).length) {
        return {
          status: 200,
          payload: { components: 0, features: 0, jsBytes: 0, cssBytes: 0, totalBytes: 0, gzipBytes: 0 }
        }
      }

      const cacheKey = estimateKey(body, selection)
      if (process.env.UIKIT_NO_BUILD_CACHE !== '1' && estimateCache.has(cacheKey)) {
        const hit = estimateCache.get(cacheKey)
        estimateCache.delete(cacheKey)
        estimateCache.set(cacheKey, hit)
        return { status: 200, payload: hit }
      }

      try {
        const result = await enqueue(() =>
          buildProfile({
            name: 'estimate-internal',
            prefix: 'ui',
            theme: body.theme && typeof body.theme === 'object' ? body.theme : {},
            selection,
            logLevel: 'silent',
            outDir: '.build/estimate-dist'
          })
        )
        const payload = {
          components: result.components.length,
          features: result.features.length,
          jsBytes: result.jsBytes,
          cssBytes: result.cssBytes,
          totalBytes: result.totalBytes,
          gzipBytes: result.gzipBytes
        }
        if (process.env.UIKIT_NO_BUILD_CACHE !== '1') {
          estimateCache.set(cacheKey, payload)
          while (estimateCache.size > ESTIMATE_CACHE_LIMIT) {
            estimateCache.delete(estimateCache.keys().next().value)
          }
        }
        return { status: 200, payload }
      } catch (error) {
        return { status: error.status || 500, payload: { error: error.message } }
      }
    },

    async build(rawBody) {
      const parsed = parseBody(rawBody)
      if (!parsed.ok) {
        return { status: 400, payload: { error: '请求 JSON 无法解析' } }
      }

      const body = parsed.value
      const name = sanitizeName(typeof body.name === 'string' ? body.name : 'custom')
      if (reservedProfileNames().has(name)) {
        return {
          status: 409,
          payload: { error: `"${name}" 是正式 profile 的保留名，自定义包请换一个名字` }
        }
      }

      try {
        const result = await enqueue(() =>
          buildProfile({
            name,
            prefix: typeof body.prefix === 'string' ? body.prefix : 'ui',
            theme: body.theme && typeof body.theme === 'object' ? body.theme : {},
            selection: body.components,
            features: Array.isArray(body.features) ? body.features : [],
            logLevel: 'silent',
            outDir: customPackageDir(name)
          })
        )
        const types = fs.readFileSync(path.join(rootDir, result.dir, 'index.d.ts'), 'utf8')
        console.log(
          `[build] ${result.dir} <- ${result.components.length} components / ${result.features.length} features`
        )
        return { status: 200, payload: { ...result, types } }
      } catch (error) {
        return { status: error.status || 500, payload: { error: error.message } }
      }
    }
  }
}

export function apiPlugin() {
  const handlers = createApiHandlers()
  const respond = async (response, task) => {
    const { status, payload } = await task
    sendJson(response, status, payload)
  }

  return {
    name: 'ui-kit-build-api',
    configureServer(server) {
      server.middlewares.use('/api/registry', (request, response) => {
        if (request.method !== 'GET') {
          sendJson(response, 405, { error: '只支持 GET' })
          return
        }
        respond(response, handlers.registry())
      })

      server.middlewares.use('/api/packages', (request, response) => {
        if (request.method !== 'GET') {
          sendJson(response, 405, { error: '只支持 GET' })
          return
        }
        respond(response, handlers.packages())
      })

      server.middlewares.use('/packs', (request, response) => {
        if (request.method !== 'GET') {
          sendJson(response, 405, { error: '只支持 GET' })
          return
        }
        serveRawPackFile(request, response)
      })

      server.middlewares.use('/api/presets', (request, response) => {
        if (request.method !== 'GET') {
          sendJson(response, 405, { error: '只支持 GET' })
          return
        }
        respond(response, handlers.presets())
      })

      server.middlewares.use('/api/estimate', async (request, response) => {
        if (request.method !== 'POST') {
          sendJson(response, 405, { error: '只支持 POST' })
          return
        }
        respond(
          response,
          handlers.estimate(await readBody(request)).catch((error) => {
            return { status: 500, payload: { error: error.message } }
          })
        )
      })

      server.middlewares.use('/api/build', async (request, response) => {
        if (request.method !== 'POST') {
          sendJson(response, 405, { error: '只支持 POST' })
          return
        }
        respond(
          response,
          handlers.build(await readBody(request)).catch((error) => {
            return { status: 500, payload: { error: error.message } }
          })
        )
      })
    }
  }
}
