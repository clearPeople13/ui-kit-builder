<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ComponentPage from './components/ComponentPage.vue'
import OverviewPage from './components/OverviewPage.vue'
import PageAnchor from './components/PageAnchor.vue'
import { activatePackageStyle, startPackageDiscovery } from './dynamic-packages'
import {
  COMPONENT_COUNT,
  DEFAULT_PACKAGE_ID,
  PACKAGES,
  componentById,
  configuratorUrl,
  groupedComponents
} from './packages'

defineOptions({ name: 'DemoApp' })

type Route = { name: 'overview' } | { name: 'component'; id: string }

const PACKAGE_STORAGE_KEY = 'ui-kit-demo-package'

const route = ref<Route>(parseRoute(window.location.hash))
const query = ref('')
const configuratorHref = configuratorUrl()
const packageId = ref(readPackageId())

const groups = computed(() => groupedComponents(query.value))
const isOverview = computed(() => route.value.name === 'overview')
const activeComponentId = computed(() => (route.value.name === 'component' ? route.value.id : ''))
const currentComponent = computed(() => {
  return route.value.name === 'component' ? componentById(route.value.id) : undefined
})
const pageTitle = computed(() => {
  return currentComponent.value ? currentComponent.value.title : '打包总览'
})
const pageHint = computed(() => {
  return currentComponent.value ? currentComponent.value.description : '各包体积、特性分布与示例入口'
})

function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '')
  if (clean.startsWith('c/')) {
    const id = clean.slice(2)
    if (id) {
      return { name: 'component', id }
    }
  }
  return { name: 'overview' }
}

function readPackageId(): string {
  const stored = window.localStorage.getItem(PACKAGE_STORAGE_KEY)
  return stored || DEFAULT_PACKAGE_ID
}

function syncRoute(): void {
  route.value = parseRoute(window.location.hash)
  window.scrollTo({ top: 0 })
}

function selectPackage(id: string): void {
  packageId.value = id
}

function navClass(id: string): string {
  return route.value.name === 'component' && route.value.id === id ? 'app-nav__item is-active' : 'app-nav__item'
}

function overviewClass(): string {
  return route.value.name === 'overview' ? 'app-nav__overview is-active' : 'app-nav__overview'
}

function packageClass(id: string): string {
  return id === packageId.value ? 'app-pkg is-active' : 'app-pkg'
}

function packageHint(id: string): string {
  const target = PACKAGES.value.find((item) => item.id === id)
  return target ? `${target.npm} · ${target.features.length} 个特性` : id
}

function componentHref(id: string): string {
  return `#/c/${id}`
}

watch(
  packageId,
  (id) => {
    window.localStorage.setItem(PACKAGE_STORAGE_KEY, id)
    activatePackageStyle(id)
  },
  { immediate: true }
)

let stopDiscovery: (() => void) | undefined

onMounted(() => {
  window.addEventListener('hashchange', syncRoute)
  if (!window.location.hash) {
    window.location.hash = '#/overview'
  }
  stopDiscovery = startPackageDiscovery()
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncRoute)
  stopDiscovery?.()
})
</script>

<template>
  <div class="app">
    <aside class="app-side" id="packages">
      <a class="app-brand" href="#/overview">
        <span class="app-brand__mark">ui</span>
        <span class="app-brand__text">
          <strong>@demo/ui-kit</strong>
          <em>{{ COMPONENT_COUNT }} 组件 · 按需构建</em>
        </span>
      </a>

      <a :class="overviewClass()" href="#/overview">
        <span>打包总览</span>
        <span class="app-nav__badge">{{ PACKAGES.length }} 包</span>
      </a>

      <a class="app-nav__overview app-nav__create" :href="configuratorHref" target="_blank" rel="noreferrer">
        <span>创建新包</span>
        <span class="app-nav__badge">构建器</span>
      </a>

      <label class="app-search">
        <span class="app-search__icon">⌕</span>
        <input v-model="query" type="search" placeholder="搜索组件 / 导出" />
      </label>

      <nav class="app-nav">
        <section v-for="group in groups" :key="group.category" class="app-nav__group">
          <p class="app-nav__category">{{ group.category }}<span>{{ group.items.length }}</span></p>
          <a
            v-for="item in group.items"
            :key="item.id"
            :class="navClass(item.id)"
            :href="componentHref(item.id)"
            :title="item.description"
          >
            <span class="app-nav__title">{{ item.title }}</span>
            <span class="app-nav__exports">{{ item.exports.length }}</span>
          </a>
        </section>
        <p v-if="!groups.length" class="app-nav__empty">没有匹配的组件</p>
      </nav>
    </aside>

    <div class="app-main">
      <header class="app-top">
        <div class="app-top__title">
          <p class="app-top__eyebrow">{{ isOverview ? 'overview' : 'component example' }}</p>
          <h1>{{ pageTitle }}</h1>
          <p class="app-top__hint">{{ pageHint }}</p>
        </div>
        <div class="app-top__packages">
          <span class="app-top__label">构建包</span>
          <div class="app-pkgs">
            <button
              v-for="item in PACKAGES"
              :key="item.id"
              :class="packageClass(item.id)"
              type="button"
              :title="packageHint(item.id)"
              @click="selectPackage(item.id)"
            >
              <span>{{ item.label }}</span>
              <em>{{ item.features.length }}</em>
            </button>
          </div>
          <a class="app-create" :href="configuratorHref" target="_blank" rel="noreferrer">
            <span class="app-create__plus">＋</span>
            <span>创建包</span>
          </a>
        </div>
      </header>

      <main class="app-content" id="playground">
        <OverviewPage v-if="isOverview" :package-id="packageId" />
        <ComponentPage v-else :component-id="activeComponentId" :package-id="packageId" />
      </main>

      <footer class="app-foot">
        <span>同一源码 · 不同属性面 · 构建期裁剪</span>
        <a :href="configuratorHref" target="_blank" rel="noreferrer">打开构建器，勾选特性并生成新包 →</a>
      </footer>
    </div>

    <aside class="app-toc">
      <PageAnchor />
    </aside>
  </div>
</template>
