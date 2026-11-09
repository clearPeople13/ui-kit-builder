import { mergeRuntimePackages, packageById, type DemoPackage } from './packages'
import { hasStaticKit, registerKit } from './playground-preview'

interface RuntimePackage extends DemoPackage {
  moduleUrl?: string
  styleUrl?: string
}

const loadedVersions = new Map<string, string>()
const failedVersions = new Set<string>()
const packageStyles = new Map<string, { url: string; link: HTMLLinkElement }>()
// 动态产物 URL 只带文件 mtime；Vite 预构建哈希变化时 Edge 会复用旧模块体，里面指向另一份 Vue 导致 inject 失败，页面级 token 强制绕开缓存
const PREVIEW_CACHE_TOKEN = String(Date.now())

let activePackageId = ''
let syncing = false

function runtimeStyle(packageId: string): string {
  return (packageById(packageId) as RuntimePackage).styleUrl ?? ''
}

function styleLink(packageId: string, url: string): HTMLLinkElement {
  const links = Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[data-package="${packageId}"]`))
  const [existing, ...extras] = links
  for (const extra of extras) {
    extra.remove()
  }
  const cached = packageStyles.get(packageId)
  if (cached && cached.url === url && cached.link === existing) {
    return cached.link
  }
  const link = existing ?? document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  link.dataset.package = packageId
  if (!existing) {
    document.head.appendChild(link)
  }
  packageStyles.set(packageId, { url, link })
  return link
}

function refreshStyleState(): void {
  for (const [id, entry] of packageStyles) {
    entry.link.disabled = id !== activePackageId
    if (!entry.link.isConnected) {
      document.head.appendChild(entry.link)
    }
  }
  const url = runtimeStyle(activePackageId)
  if (!url || hasStaticKit(activePackageId)) {
    return
  }
  const link = styleLink(activePackageId, url)
  link.disabled = false
  if (!link.isConnected) {
    document.head.appendChild(link)
  }
}

export function activatePackageStyle(packageId: string): void {
  activePackageId = packageId
  refreshStyleState()
}

async function loadModule(item: RuntimePackage): Promise<void> {
  if (!item.moduleUrl || hasStaticKit(item.id)) {
    return
  }
  if (loadedVersions.get(item.id) === item.moduleUrl || failedVersions.has(item.moduleUrl)) {
    return
  }
  try {
    const moduleUrl = `${item.moduleUrl}${item.moduleUrl.includes('?') ? '&' : '?'}preview=${PREVIEW_CACHE_TOKEN}`
    const module = await import(/* @vite-ignore */ moduleUrl)
    registerKit(item.id, module)
    loadedVersions.set(item.id, item.moduleUrl)
  } catch (error) {
    failedVersions.add(item.moduleUrl)
    console.error(`[packages] 动态加载 ${item.id} 失败`, error)
  }
}

async function syncPackages(): Promise<void> {
  if (syncing) {
    return
  }
  syncing = true
  try {
    const response = await fetch('/api/packages', { cache: 'no-store' })
    if (!response.ok) {
      return
    }
    const data = await response.json()
    const list: RuntimePackage[] = Array.isArray(data?.packages) ? data.packages : []
    mergeRuntimePackages(list)
    await Promise.all(list.map(loadModule))
    refreshStyleState()
  } catch {
    // 静态部署没有构建 API 时保持内置包列表
  } finally {
    syncing = false
  }
}

export function startPackageDiscovery(): () => void {
  void syncPackages()
  const timer = window.setInterval(() => {
    if (!document.hidden) {
      void syncPackages()
    }
  }, 3000)
  const handleFocus = (): void => {
    void syncPackages()
  }
  window.addEventListener('focus', handleFocus)
  return () => {
    window.clearInterval(timer)
    window.removeEventListener('focus', handleFocus)
  }
}
