<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PlaygroundPreviewHost from '../playground-preview'
import IconLibrary from './IconLibrary.vue'
import OnlinePlayground from './OnlinePlayground.vue'
import PropDrawer from './PropDrawer.vue'
import { sceneSourceCode } from '../demo-code'
import { useVueHighlight } from '../use-highlight'
import { PLAYGROUND_GROUPS, buildBaseValues, type PlaygroundControl, type PlaygroundEntry } from '../playground'
import { componentById, componentFeaturesOf, featureAvailable, packageById, type DemoPackage } from '../packages'
import { dropGroupValues, groupDefaults, presetValues, requiredFeatures, sceneViews, type SceneView } from '../scenes'
import { lazyLoadCascader } from '../cascader-data'
import { setToc, type TocItem } from '../toc'

defineOptions({ name: 'ComponentPage' })

interface ApiPropRow {
  name: string
  type: string
  description: string
  defaultText: string
  locked: boolean
}

interface ApiSection {
  key: string
  title: string
  description: string
  locked: boolean
  rows: ApiPropRow[]
}

interface ApiBlock {
  name: string
  sections: ApiSection[]
  methods: string[]
}

const props = defineProps<{
  componentId: string
  packageId: string
}>()

const activeExportName = ref('')
const activeSceneId = ref('')
const enabledGroups = ref<Set<string>>(new Set(['core']))
const disabledDefaultGroups = ref<Set<string>>(new Set())
const overrides = ref<Record<string, unknown>>({})
const drawerOpen = ref(false)
const codeOpen = ref(false)
const playgroundOpen = ref(false)

const TRIGGER_EXPORTS = new Set(['Dialog', 'Drawer', 'MessageBox', 'Tour', 'Notification', 'ImageViewer'])

const AUTOCOMPLETE_DICTIONARY = [
  'Vue',
  'Vue Router',
  'Vuetify',
  'Vite',
  'Vitest',
  'Pinia',
  'TypeScript',
  'Tailwind CSS'
]

const BACKTOP_DEMO_ROWS = Array.from({ length: 20 }, (_, index) => `第 ${index + 1} 行 · 滚动查看回到顶部按钮`)
const AFFIX_DEMO_ROWS = Array.from({ length: 12 }, (_, index) => `占位内容 ${index + 1} · 在容器内滚动验证吸附`)
const AFFIX_LEADING_ROWS = Array.from({ length: 8 }, (_, index) => `前置内容 ${index + 1} · 把吸附点推到容器下方`)
const LANDMARKS = [
  { id: 'pg-landmark-a', title: '面板概览', text: '锚点与引导的目标区块一，用于验证滚动定位与遮罩镂空。' },
  { id: 'pg-landmark-b', title: '属性调试', text: '目标区块二，滚动到此处后对应链接会高亮。' },
  { id: 'pg-landmark-c', title: '构建产物', text: '目标区块三，用于验证底部边界与完成引导。' }
]

const ANCHOR_SECTIONS = [
  { level: 0, id: 'pg-sec-overview', title: '概览', text: 'Anchor 由导航与页内 id 目标配对，点击后滚动定位，滚动时按阈值反查当前区块。' },
  { level: 1, id: 'pg-sec-layout', title: '布局', text: '子级链接缩进显示，激活时父级链路一起点亮。' },
  { level: 1, id: 'pg-sec-theme', title: '主题', text: '配色取自 --ui-color-primary 等主题变量，随主题切换。' },
  { level: 0, id: 'pg-sec-props', title: '属性调试', text: 'type 决定形态，bound 决定激活阈值，offset 决定定位后预留的顶部间距。' },
  { level: 1, id: 'pg-sec-props-anchor', title: 'Anchor', text: '容器负责监听滚动、计算激活链接并向下提供上下文。' },
  { level: 1, id: 'pg-sec-props-link', title: 'AnchorLink', text: '链接负责渲染文本、拦截页内跳转并回显激活态。' },
  { level: 0, id: 'pg-sec-build', title: '构建产物', text: '滚动偏移特性只在勾选后进入产物，未包含时开关置灰锁定。' }
]

function anchorSectionClass(section: (typeof ANCHOR_SECTIONS)[number]): string {
  return section.level ? 'pg-anchor-demo__section pg-anchor-demo__section--sub' : 'pg-anchor-demo__section'
}

function fetchAutocompleteSuggestions(query: string, deliver: (list: string[]) => void): void {
  const keyword = String(query ?? '')
    .trim()
    .toLowerCase()
  setTimeout(() => {
    deliver(AUTOCOMPLETE_DICTIONARY.filter((item) => !keyword || item.toLowerCase().includes(keyword)))
  }, 450)
}

const DEMO_PROPS: Record<string, Record<string, unknown>> = {
  Autocomplete: {
    fetchSuggestions: fetchAutocompleteSuggestions
  },
  Cascader: {
    lazyLoad: lazyLoadCascader
  },
  CascaderPanel: {
    props: { lazyLoad: lazyLoadCascader }
  }
}

const component = computed(() => componentById(props.componentId))
const target = computed<DemoPackage>(() => packageById(props.packageId))

const entries = computed<PlaygroundEntry[]>(() => {
  const group = PLAYGROUND_GROUPS.find((item) => item.id === props.componentId)
  return group ? group.exports : []
})

const activeEntry = computed<PlaygroundEntry | undefined>(() => {
  return entries.value.find((entry) => entry.name === activeExportName.value) ?? entries.value[0]
})

const scenes = computed<SceneView[]>(() => {
  const entry = activeEntry.value
  return entry ? sceneViews(entry, target.value, props.componentId) : []
})

const activeScene = computed<SceneView | undefined>(() => {
  const current = scenes.value.find((scene) => scene.id === activeSceneId.value)
  if (current && current.available) {
    return current
  }
  return scenes.value.find((scene) => scene.available) ?? scenes.value[0]
})

const activeSceneCode = computed(() => {
  const entry = activeEntry.value
  return entry ? sceneSourceCode(entry, activeScene.value) : ''
})

const highlightedCode = useVueHighlight(activeSceneCode, codeOpen)

function formatDefault(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '—'
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return '—'
  }
}

const apiBlocks = computed<ApiBlock[]>(() => {
  const comp = component.value
  if (!comp) {
    return []
  }
  return comp.exports.map((exp) => {
    const sections: ApiSection[] = []
    if (exp.coreProps.length) {
      sections.push({
        key: 'core',
        title: '基础属性',
        description: '',
        locked: false,
        rows: exp.coreProps.map((prop) => ({
          name: prop.name,
          type: prop.type,
          description: prop.description ?? '',
          defaultText: formatDefault(prop.default),
          locked: false
        }))
      })
    }
    for (const feature of exp.features) {
      if (!feature.props.length) {
        continue
      }
      const locked = !featureAvailable(target.value, props.componentId, feature.id)
      sections.push({
        key: feature.id,
        title: feature.title,
        description: feature.description,
        locked,
        rows: feature.props.map((prop) => ({
          name: prop.name,
          type: prop.type,
          description: prop.description ?? '',
          defaultText: formatDefault(prop.default),
          locked
        }))
      })
    }
    return { name: exp.name, sections, methods: exp.methods ?? [] }
  })
})

function isDefaultOnControl(control: PlaygroundControl): boolean {
  if (control.kind === 'switch') {
    return control.defaultValue === true
  }
  return control.offValue !== undefined
}

const defaultOnGroups = computed(() => {
  const entry = activeEntry.value
  const ids = new Set<string>()
  if (!entry) {
    return ids
  }
  for (const group of entry.groups) {
    if (group.id === 'core' || !featureAvailable(target.value, props.componentId, group.id)) {
      continue
    }
    if (group.controls.some(isDefaultOnControl)) {
      ids.add(group.id)
    }
  }
  return ids
})

function groupActive(groupId: string): boolean {
  if (enabledGroups.value.has(groupId)) {
    return true
  }
  return defaultOnGroups.value.has(groupId) && !disabledDefaultGroups.value.has(groupId)
}

const featureGroups = computed(() => {
  const entry = activeEntry.value
  if (!entry) {
    return []
  }
  return entry.groups
    .filter((group) => group.id !== 'core' && group.controls.length > 0)
    .map((group) => ({
      id: group.id,
      title: group.title,
      description: group.description,
      props: group.controls.length,
      available: featureAvailable(target.value, props.componentId, group.id),
      active: groupActive(group.id)
    }))
})

function disabledFeatureDefaults(entry: PlaygroundEntry): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const control of entry.controls) {
    if (control.featureId === 'core' || groupActive(control.featureId)) {
      continue
    }
    if (!featureAvailable(target.value, props.componentId, control.featureId)) {
      continue
    }
    if (control.offValue !== undefined) {
      values[control.name] = control.offValue
      continue
    }
    if (control.kind !== 'switch' || control.defaultValue !== true) {
      continue
    }
    values[control.name] = false
  }
  return values
}

const previewValues = computed(() => {
  const entry = activeEntry.value
  if (!entry) {
    return {}
  }
  return {
    ...buildBaseValues(entry, enabledGroups.value),
    ...(DEMO_PROPS[entry.name] ?? {}),
    ...disabledFeatureDefaults(entry),
    ...overrides.value
  }
})

const activeIconName = computed(() => {
  const name = previewValues.value.name
  return typeof name === 'string' ? name : ''
})

const tracksModelValue = computed(() => activeEntry.value?.previewEvents.includes('modelValue') ?? false)

const modelValueText = computed(() => {
  const value = previewValues.value.modelValue
  if (value === undefined || value === null || value === '') {
    return '—'
  }
  return JSON.stringify(value)
})

const overrideCount = computed(() => Object.keys(overrides.value).length)

const packageFeatureCount = computed(() => componentFeaturesOf(target.value, props.componentId).length)

const totalFeatureCount = computed(() => {
  const ids = new Set<string>()
  for (const entry of entries.value) {
    for (const feature of entry.groups) {
      if (feature.id !== 'core' && feature.controls.length) {
        ids.add(feature.id)
      }
    }
  }
  return ids.size
})

const lockedFeatures = computed(() => {
  return featureGroups.value.filter((group) => !group.available)
})

const tocItems = computed<TocItem[]>(() => {
  const items: TocItem[] = [{ id: 'cp-sec-demo', title: '代码演示' }]
  items.push({ id: 'cp-sec-features', title: '特性开关' })
  if (component.value?.id === 'icon') {
    items.push({ id: 'cp-sec-icons', title: '图标库' })
  }
  items.push({ id: 'cp-sec-api', title: 'API' })
  if (lockedFeatures.value.length) {
    items.push({ id: 'cp-sec-locked', title: '本包裁剪的特性' })
  }
  return items
})

watch(tocItems, (items) => setToc('本页目录', items), { immediate: true })

const needsTrigger = computed(() => {
  return activeEntry.value ? TRIGGER_EXPORTS.has(activeEntry.value.name) : false
})

function openPreview(): void {
  overrides.value = { ...overrides.value, modelValue: true }
}

function resetScene(): void {
  const entry = activeEntry.value
  if (!entry) {
    activeSceneId.value = ''
    enabledGroups.value = new Set(['core'])
    disabledDefaultGroups.value = new Set()
    overrides.value = {}
    return
  }
  const available = scenes.value.find((scene) => scene.available)
  if (!available) {
    activeSceneId.value = 'base'
    enabledGroups.value = new Set(['core'])
    disabledDefaultGroups.value = new Set()
    overrides.value = {}
    return
  }
  applyScene(available)
}

function applyScene(scene: SceneView): void {
  const entry = activeEntry.value
  if (!entry || !scene.available) {
    return
  }
  const groups = new Set<string>(['core'])
  for (const feature of requiredFeatures(scene.requires)) {
    groups.add(feature)
  }
  activeSceneId.value = scene.id
  enabledGroups.value = groups
  disabledDefaultGroups.value = new Set()
  overrides.value = presetValues(entry, scene, groups)
}

function selectExport(name: string): void {
  if (name === activeExportName.value) {
    return
  }
  activeExportName.value = name
  resetScene()
}

function sceneKeepsFeatureOn(entry: PlaygroundEntry, scene: SceneView, groupId: string): boolean {
  for (const [name, value] of Object.entries(scene.values)) {
    const control = entry.controls.find((item) => item.name === name)
    if (control?.featureId !== groupId) {
      continue
    }
    if (control.kind === 'switch' && value === false) {
      return false
    }
    if (control.offValue !== undefined && value === control.offValue) {
      return false
    }
  }
  return true
}

function toggleFeature(groupId: string): void {
  const entry = activeEntry.value
  if (!entry) {
    return
  }
  const available = featureAvailable(target.value, props.componentId, groupId)
  if (!available) {
    return
  }
  if (groupActive(groupId)) {
    const next = new Set(enabledGroups.value)
    next.delete(groupId)
    if (defaultOnGroups.value.has(groupId)) {
      disabledDefaultGroups.value = new Set(disabledDefaultGroups.value).add(groupId)
    }
    enabledGroups.value = next
    overrides.value = dropGroupValues(overrides.value, entry, groupId)
    const activeScene = scenes.value.find((scene) => scene.id === activeSceneId.value)
    if (activeScene && requiredFeatures(activeScene.requires).includes(groupId)) {
      const base = scenes.value.find((scene) => scene.available && !requiredFeatures(scene.requires).length)
      activeSceneId.value = base ? base.id : ''
      overrides.value = base ? presetValues(entry, base, next) : {}
    }
    return
  }
  const next = new Set(enabledGroups.value).add(groupId)
  if (disabledDefaultGroups.value.has(groupId)) {
    const restored = new Set(disabledDefaultGroups.value)
    restored.delete(groupId)
    disabledDefaultGroups.value = restored
  }
  const scene = scenes.value.find(
    (item) =>
      item.available && requiredFeatures(item.requires).includes(groupId) && sceneKeepsFeatureOn(entry, item, groupId)
  )
  if (scene) {
    const sceneGroups = new Set(next)
    for (const feature of requiredFeatures(scene.requires)) {
      sceneGroups.add(feature)
    }
    enabledGroups.value = sceneGroups
    activeSceneId.value = scene.id
    overrides.value = { ...overrides.value, ...presetValues(entry, scene, sceneGroups) }
    return
  }
  enabledGroups.value = next
  overrides.value = { ...overrides.value, ...groupDefaults(entry, groupId) }
}

function handleSync(name: string, value: unknown): void {
  overrides.value = { ...overrides.value, [name]: value }
}

function handleIconSelect(name: string): void {
  overrides.value = { ...overrides.value, name }
}

function handlePropChange(name: string, value: unknown): void {
  const next = { ...overrides.value }
  if (value === undefined) {
    delete next[name]
  } else {
    next[name] = value
  }
  overrides.value = next
}

function resetOverrides(): void {
  overrides.value = {}
}

function defaultExportName(list: PlaygroundEntry[], componentId: string): string {
  const normalized = componentId.replace(/-/g, '').toLowerCase()
  const primary = list.find((entry) => entry.name.toLowerCase() === normalized)
  return primary?.name ?? list[0]?.name ?? ''
}

function handleContextChange(): void {
  drawerOpen.value = false
  if (!entries.value.some((entry) => entry.name === activeExportName.value)) {
    activeExportName.value = defaultExportName(entries.value, props.componentId)
  }
  resetScene()
}

function exportClass(name: string): string {
  return name === activeExportName.value ? 'cp-tab is-active' : 'cp-tab'
}

function sceneClass(scene: SceneView): string {
  const classes = ['cp-scene']
  if (scene.id === activeSceneId.value && scene.available) {
    classes.push('is-active')
  }
  if (!scene.available) {
    classes.push('is-locked')
  }
  return classes.join(' ')
}

function switchClass(group: { available: boolean; active: boolean }): string {
  const classes = ['cp-switch']
  if (group.active) {
    classes.push('is-on')
  }
  if (!group.available) {
    classes.push('is-locked')
  }
  return classes.join(' ')
}

function featureClass(group: { available: boolean; active: boolean }): string {
  const classes = ['cp-feature']
  if (group.active) {
    classes.push('is-on')
  }
  if (!group.available) {
    classes.push('is-locked')
  }
  return classes.join(' ')
}

watch(() => [props.componentId, props.packageId], handleContextChange, { immediate: true })
</script>

<template>
  <article v-if="component && activeEntry" class="cp">
    <header class="cp-head">
      <div class="cp-head__main">
        <p class="cp-eyebrow">{{ component.category }} · {{ target.label }}</p>
        <h1 class="cp-title">{{ component.title }}</h1>
        <p class="cp-desc">{{ component.description || '该组件暂无描述。' }}</p>
      </div>
      <div class="cp-head__meta">
        <span class="cp-chip cp-chip--code">{{ target.npm }}</span>
        <span class="cp-chip">前缀 {{ target.prefix }}</span>
        <span class="cp-chip">本包特性 {{ packageFeatureCount }} / {{ totalFeatureCount }}</span>
      </div>
    </header>

    <div v-if="entries.length > 1" class="cp-tabs">
      <span class="cp-tabs__label">导出</span>
      <button
        v-for="entry in entries"
        :key="entry.name"
        :class="exportClass(entry.name)"
        type="button"
        @click="selectExport(entry.name)"
      >
        {{ entry.name }}
      </button>
    </div>

    <section id="cp-sec-demo" class="cp-block">
      <div class="cp-block__head">
        <h2 class="cp-block__title">代码演示</h2>
        <button class="cp-link-btn" type="button" @click="resetScene">重置</button>
      </div>
      <div class="cp-scenes">
        <button
          v-for="scene in scenes"
          :key="scene.id"
          :class="sceneClass(scene)"
          type="button"
          :disabled="!scene.available"
          :title="scene.reason || scene.hint || scene.label"
          @click="applyScene(scene)"
        >
          <span>{{ scene.label }}</span>
          <span v-if="!scene.available" class="cp-lock">未包含</span>
        </button>
      </div>
      <div class="cp-demo">
        <div class="pg-stage">
          <div class="pg-stage__canvas">
            <div v-if="component.id === 'backtop'" id="pg-backtop-scroller" class="pg-backtop-demo">
              <p class="pg-backtop-demo__hint">滚动此面板，超过 visibilityHeight 后按钮贴在面板右下角内侧</p>
              <div v-for="row in BACKTOP_DEMO_ROWS" :key="row" class="pg-backtop-demo__row">{{ row }}</div>
            </div>
            <div v-if="component.id === 'affix'" id="pg-affix-scroller" class="pg-affix-demo">
              <p class="pg-affix-demo__hint">在容器内滚动，Affix 到达顶/底边缘后吸附；target 场景指向此容器</p>
              <div v-for="row in AFFIX_LEADING_ROWS" :key="row" class="pg-affix-demo__row">{{ row }}</div>
              <PlaygroundPreviewHost
                :package-id="target.id"
                :export-name="activeEntry.name"
                :scene-id="activeSceneId"
                :values="previewValues"
                :event-props="activeEntry.previewEvents"
                @sync="handleSync"
              />
              <div v-for="row in AFFIX_DEMO_ROWS" :key="row" class="pg-affix-demo__row">{{ row }}</div>
            </div>
            <div v-if="component.id === 'anchor'" class="pg-anchor-demo">
              <div class="pg-anchor-demo__nav">
                <PlaygroundPreviewHost
                  :package-id="target.id"
                  :export-name="activeEntry.name"
                  :scene-id="activeSceneId"
                  :values="previewValues"
                  :event-props="activeEntry.previewEvents"
                  @sync="handleSync"
                />
              </div>
              <div class="pg-anchor-demo__body">
                <p class="pg-anchor-demo__hint">滚动右侧区块观察高亮：按 bound 阈值定位，子级激活时父级链路一起点亮</p>
                <div class="pg-anchor-demo__scroller">
                  <section
                    v-for="section in ANCHOR_SECTIONS"
                    :id="section.id"
                    :key="section.id"
                    :class="anchorSectionClass(section)"
                  >
                    <h4>{{ section.title }}</h4>
                    <p>{{ section.text }}</p>
                  </section>
                  <p class="pg-anchor-demo__tail">尾部留白：保证最后一个目标也能滚到容器顶部并高亮</p>
                </div>
              </div>
            </div>
            <div v-if="component.id === 'tour'" class="pg-anchor-demo__sections">
              <section v-for="section in LANDMARKS" :id="section.id" :key="section.id" class="pg-anchor-demo__section">
                <h4>{{ section.title }}</h4>
                <p>{{ section.text }}</p>
              </section>
            </div>
            <PlaygroundPreviewHost
              v-if="component.id !== 'affix' && component.id !== 'anchor'"
              :package-id="target.id"
              :export-name="activeEntry.name"
              :scene-id="activeSceneId"
              :values="previewValues"
              :event-props="activeEntry.previewEvents"
              @sync="handleSync"
            />
          </div>
        </div>
        <div v-if="tracksModelValue" class="pg-stage__value">
          <span class="pg-stage__value-label">modelValue</span>
          <code class="pg-stage__value-code">{{ modelValueText }}</code>
          <span class="pg-stage__value-hint">v-model 实时值</span>
        </div>
        <div class="cp-demo__ops">
          <button class="cp-open-btn" type="button" @click="drawerOpen = true">属性调试 · {{ overrideCount }}</button>
          <button v-if="needsTrigger" class="cp-open-btn" type="button" @click="openPreview">
            打开 {{ activeEntry.name }}
          </button>
          <button class="cp-demo__code-btn" type="button" @click="playgroundOpen = true">在线调试</button>
          <span class="cp-demo__flex" />
          <button
            class="cp-demo__code-btn"
            type="button"
            :aria-expanded="codeOpen"
            @click="codeOpen = !codeOpen"
          >
            {{ codeOpen ? '收起代码' : '展开代码' }}
          </button>
        </div>
        <div v-if="codeOpen" class="cp-demo__code" v-html="highlightedCode" />
        <div class="cp-demo__desc">
          <h3>{{ activeScene?.label }}</h3>
          <p>{{ activeScene?.reason || activeScene?.hint || '该示例未填写描述。' }}</p>
        </div>
      </div>
      <div class="pg-stage__foot">
        <p class="pg-stage__note">{{ activeEntry.note || activeEntry.componentDescription }}</p>
        <div class="pg-stage__meta">
          <span class="pg-stat"
            ><strong>{{ activeEntry.controls.length }}</strong> / {{ activeEntry.allProps }} 可调</span
          >
          <span v-if="lockedFeatures.length" class="pg-stat is-muted">{{ lockedFeatures.length }} 个特性未包含</span>
          <span v-else-if="featureGroups.length" class="pg-stat">全部特性已包含</span>
        </div>
      </div>
    </section>

    <section id="cp-sec-features" class="cp-block">
      <div class="cp-block__head">
        <h2 class="cp-block__title">特性开关</h2>
        <p class="cp-block__hint">可见性由 {{ target.label }} 的构建配置决定，未启用的特性不会出现在运行时</p>
      </div>
      <div v-if="featureGroups.length" class="cp-features">
        <button
          v-for="group in featureGroups"
          :key="group.id"
          :class="featureClass(group)"
          type="button"
          :disabled="!group.available"
          :aria-pressed="group.active"
          :title="group.available ? group.description : '当前包未启用该特性'"
          @click="toggleFeature(group.id)"
        >
          <span :class="switchClass(group)"><span class="cp-switch__dot" /></span>
          <span class="cp-feature__body">
            <span class="cp-feature__title">{{ group.title }}</span>
            <span class="cp-feature__meta">{{ group.id }} · {{ group.props }} props</span>
          </span>
          <span v-if="!group.available" class="cp-lock">未包含</span>
        </button>
      </div>
      <p v-else class="cp-muted">该导出没有可切换的特性属性，直接选择上面的场景即可。</p>
    </section>

    <section v-if="component.id === 'icon' && activeEntry.name === 'Icon'" id="cp-sec-icons" class="cp-block">
      <div class="cp-block__head">
        <h2 class="cp-block__title">图标库</h2>
        <p class="cp-block__hint">搜索或按分类筛选，点击图标即可把 name 应用到上方预览</p>
      </div>
      <IconLibrary :package-id="target.id" :active-name="activeIconName" @select="handleIconSelect" />
    </section>

    <section id="cp-sec-api" class="cp-block">
      <div class="cp-block__head">
        <h2 class="cp-block__title">API</h2>
        <p class="cp-block__hint">灰显区块表示 {{ target.label }} 未启用该特性，对应属性不在构建产物中</p>
      </div>
      <div v-for="block in apiBlocks" :key="block.name" class="cp-api">
        <h3 class="cp-api__export">{{ block.name }}</h3>
        <div
          v-for="sec in block.sections"
          :key="sec.key"
          :class="sec.locked ? 'cp-api__sec is-locked' : 'cp-api__sec'"
        >
          <h4 class="cp-api__sec-title">
            {{ sec.title }}
            <code v-if="sec.key !== 'core'" class="cp-api__id">{{ sec.key }}</code>
            <span v-if="sec.locked" class="cp-lock">当前包未启用</span>
          </h4>
          <p v-if="sec.description" class="cp-api__sec-desc">{{ sec.description }}</p>
          <table class="cp-api__table">
            <thead>
              <tr>
                <th>参数</th>
                <th>说明</th>
                <th>类型</th>
                <th>默认值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in sec.rows" :key="row.name">
                <td><code>{{ row.name }}</code></td>
                <td>{{ row.description || '—' }}</td>
                <td><code class="cp-api__type">{{ row.type }}</code></td>
                <td><code>{{ row.defaultText }}</code></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="block.methods.length" class="cp-api__sec">
          <h4 class="cp-api__sec-title">Methods</h4>
          <table class="cp-api__table">
            <thead>
              <tr>
                <th>方法名</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="method in block.methods" :key="method">
                <td><code>{{ method }}</code></td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-if="lockedFeatures.length" id="cp-sec-locked" class="cp-locked">
      <h3 class="cp-locked__title">本包裁剪的特性</h3>
      <div class="cp-locked__list">
        <span v-for="group in lockedFeatures" :key="group.id" class="cp-locked__item">
          {{ group.title }}
          <code>{{ group.id }}</code>
        </span>
      </div>
      <p class="cp-muted">切换到 Full 包即可看到这些特性的开关与场景。</p>
    </section>
  </article>

  <div v-else class="cp-missing">
    <p>未找到组件 {{ componentId }}。</p>
    <a href="#/overview">返回总览</a>
  </div>

  <PropDrawer
    v-if="drawerOpen && activeEntry"
    :entry="activeEntry"
    :values="previewValues"
    :overrides="overrides"
    :package-id="target.id"
    @change="handlePropChange"
    @reset="resetOverrides"
    @close="drawerOpen = false"
  />

  <OnlinePlayground
    v-if="playgroundOpen && activeEntry"
    :package-id="target.id"
    :export-name="activeEntry.name"
    :snippet="activeSceneCode"
    @close="playgroundOpen = false"
  />
</template>
