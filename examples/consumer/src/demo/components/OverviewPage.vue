<script setup lang="ts">
import { computed } from 'vue'
import {
  ALL_FEATURE_COUNT,
  COMPONENT_COUNT,
  EXPORT_COUNT,
  PACKAGES,
  configuratorUrl,
  featureMatrix,
  formatDelta,
  formatKb,
  gzipShare,
  type DemoPackage
} from '../packages'

defineOptions({ name: 'OverviewPage' })

const props = defineProps<{
  packageId: string
}>()

const corePackage = computed<DemoPackage>(() => {
  return PACKAGES.value.find((item) => item.id === 'core') ?? PACKAGES.value[0]
})

const matrix = computed(() => featureMatrix())

const maxFeatureCount = computed(() => {
  return Math.max(...PACKAGES.value.map((item) => item.features.length), 1)
})

const fullPackage = computed<DemoPackage | undefined>(() => {
  return PACKAGES.value.find((item) => item.id === 'full')
})

const configuratorHref = configuratorUrl()

function packageCardClass(item: DemoPackage): string {
  const classes = ['ov-card']
  if (item.id === props.packageId) {
    classes.push('is-active')
  }
  if (item.id === 'full') {
    classes.push('is-full')
  }
  return classes.join(' ')
}

function featureBarStyle(item: DemoPackage): Record<string, string> {
  return { width: `${Math.round((item.features.length / maxFeatureCount.value) * 100)}%` }
}

function gzipBarStyle(item: DemoPackage): Record<string, string> {
  return { width: `${gzipShare(item.sizes.gzip)}%` }
}

function packageDelta(item: DemoPackage): string {
  return formatDelta(item.sizes.total, corePackage.value.sizes.total)
}

function componentHref(id: string): string {
  return `#/c/${id}`
}

function countText(count: number): string {
  return count ? String(count) : '·'
}

function matrixHeaderClass(item: DemoPackage): string {
  return item.id === props.packageId ? 'ov-matrix__head is-active' : 'ov-matrix__head'
}

function coveredComponents(item: DemoPackage): number {
  return Object.values(item.componentFeatures).filter((features) => features.length > 0).length
}
</script>

<template>
  <article class="ov">
    <header class="ov-hero">
      <p class="ov-eyebrow">build-time feature elimination</p>
      <h1 class="ov-title">按需特性包 <em>打包对比</em></h1>
      <p class="ov-text">
        同一份源码构建出 {{ PACKAGES.length }} 个真实产物：只包含被勾选的 props、运行时分支、CSS 与类型声明。
        左侧导航按组件进入示例页，右上角随时切换包，场景与特性开关会跟着构建配置变化。
      </p>
      <dl class="ov-stats">
        <div class="ov-stat">
          <dt>构建包</dt>
          <dd>{{ PACKAGES.length }}</dd>
        </div>
        <div class="ov-stat">
          <dt>组件</dt>
          <dd>{{ COMPONENT_COUNT }}</dd>
        </div>
        <div class="ov-stat">
          <dt>导出</dt>
          <dd>{{ EXPORT_COUNT }}</dd>
        </div>
        <div class="ov-stat">
          <dt>全量特性</dt>
          <dd>{{ ALL_FEATURE_COUNT }}</dd>
        </div>
      </dl>
    </header>

    <section class="ov-section">
      <div class="ov-section__head">
        <h2 class="ov-section__title">产物体积与特性数</h2>
        <p class="ov-section__hint">字节数来自各包 meta.json，差值相对 Core 包</p>
      </div>
      <div class="ov-cards">
        <article v-for="item in PACKAGES" :key="item.id" :class="packageCardClass(item)">
          <div class="ov-card__head">
            <div>
              <p class="ov-card__name">{{ item.label }}</p>
              <p class="ov-card__npm">{{ item.npm }}</p>
            </div>
            <span class="ov-card__prefix">.{{ item.prefix }}</span>
          </div>
          <div class="ov-card__size">
            <strong>{{ formatKb(item.sizes.total) }}</strong>
            <span>gzip {{ formatKb(item.sizes.gzip) }}</span>
          </div>
          <div class="ov-bar">
            <span :style="gzipBarStyle(item)" />
          </div>
          <dl class="ov-card__grid">
            <div>
              <dt>JS</dt>
              <dd>{{ formatKb(item.sizes.js) }}</dd>
            </div>
            <div>
              <dt>CSS</dt>
              <dd>{{ formatKb(item.sizes.css) }}</dd>
            </div>
            <div>
              <dt>较 Core</dt>
              <dd>{{ packageDelta(item) }}</dd>
            </div>
            <div>
              <dt>特性</dt>
              <dd>{{ item.features.length }}</dd>
            </div>
            <div>
              <dt>含特性组件</dt>
              <dd>{{ coveredComponents(item) }}</dd>
            </div>
            <div>
              <dt>文件</dt>
              <dd>{{ item.files.length }}</dd>
            </div>
          </dl>
          <div class="ov-card__feature-bar">
            <span :style="featureBarStyle(item)" />
          </div>
        </article>
      </div>
      <p v-if="fullPackage" class="ov-callout">
        <strong>{{ fullPackage.label }}</strong> 启用了全部 {{ fullPackage.features.length }} 个特性，
        是所有示例的完整形态；其余包保留同样的组件，只裁剪特性面。
        <a :href="configuratorHref" target="_blank" rel="noreferrer">打开构建器创建新包 →</a>
      </p>
    </section>

    <section class="ov-section">
      <div class="ov-section__head">
        <h2 class="ov-section__title">组件 × 包 特性分布</h2>
        <p class="ov-section__hint">只列出至少在一个包中启用特性的组件，点击行进入示例页</p>
      </div>
      <div class="ov-matrix-wrap">
        <table class="ov-matrix">
          <thead>
            <tr>
              <th class="ov-matrix__corner">组件</th>
              <th v-for="item in PACKAGES" :key="item.id" :class="matrixHeaderClass(item)">
                {{ item.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in matrix.rows" :key="row.id">
              <td class="ov-matrix__name">
                <a :href="componentHref(row.id)">{{ row.title }} <code>{{ row.id }}</code></a>
              </td>
              <td v-for="item in PACKAGES" :key="item.id" :class="row.counts[item.id] ? 'is-on' : 'is-off'">
                {{ countText(row.counts[item.id]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </article>
</template>
