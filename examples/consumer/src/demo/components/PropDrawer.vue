<script setup lang="ts">
import { computed, ref } from 'vue'
import { featureAvailable, packageById } from '../packages'
import { formatControlText, type PlaygroundControl, type PlaygroundEntry } from '../playground'

defineOptions({ name: 'PropDrawer' })

const props = defineProps<{
  entry: PlaygroundEntry
  values: Record<string, unknown>
  overrides: Record<string, unknown>
  packageId: string
}>()

const emit = defineEmits<{
  change: [name: string, value: unknown]
  reset: []
  close: []
}>()

const query = ref('')

const groups = computed(() => {
  const target = packageById(props.packageId)
  const keyword = query.value.trim().toLowerCase()
  return props.entry.groups
    .map((group) => {
      const controls = group.controls.filter((control) => {
        if (!keyword) {
          return true
        }
        return control.name.toLowerCase().includes(keyword) || control.description.toLowerCase().includes(keyword)
      })
      return {
        ...group,
        controls,
        available: group.id === 'core' || featureAvailable(target, props.entry.componentId, group.id)
      }
    })
    .filter((group) => group.controls.length > 0)
})

const matchedCount = computed(() => {
  return groups.value.reduce((total, group) => total + group.controls.length, 0)
})

const dirtyCount = computed(() => Object.keys(props.overrides).length)

function effectiveValue(control: PlaygroundControl): unknown {
  const value = props.values[control.name]
  return value === undefined ? control.sampleValue : value
}

function isOverridden(control: PlaygroundControl): boolean {
  return control.name in props.overrides
}

function controlEnabled(control: PlaygroundControl): boolean {
  return control.name in props.values || control.kind === 'switch'
}

function switchValue(control: PlaygroundControl): boolean {
  return Boolean(effectiveValue(control))
}

function toggleSwitch(control: PlaygroundControl): void {
  emit('change', control.name, !switchValue(control))
}

function textValue(control: PlaygroundControl): string {
  const value = effectiveValue(control)
  return value === undefined || value === null ? '' : String(value)
}

function handleText(control: PlaygroundControl, event: Event): void {
  emit('change', control.name, (event.target as HTMLInputElement).value)
}

function handleNumber(control: PlaygroundControl, event: Event): void {
  const raw = (event.target as HTMLInputElement).value.trim()
  if (!raw) {
    return
  }
  const value = Number(raw)
  if (Number.isFinite(value)) {
    emit('change', control.name, value)
  }
}

function handleSelect(control: PlaygroundControl, event: Event): void {
  emit('change', control.name, (event.target as HTMLSelectElement).value)
}

function handleColor(control: PlaygroundControl, event: Event): void {
  emit('change', control.name, (event.target as HTMLInputElement).value)
}

function handleJson(control: PlaygroundControl, event: Event): void {
  const text = (event.target as HTMLTextAreaElement).value
  try {
    emit('change', control.name, JSON.parse(text))
  } catch {
    // 输入过程中的非法 JSON 不写入预览
  }
}

function jsonText(control: PlaygroundControl): string {
  return formatControlText(effectiveValue(control), 'json')
}

function resetControl(control: PlaygroundControl): void {
  emit('change', control.name, undefined)
}

function groupClass(available: boolean): string {
  return available ? 'pg-group' : 'pg-group is-locked'
}
</script>

<template>
  <div class="pg-drawer__mask" @click="emit('close')" />
  <aside class="pg-drawer" role="dialog" aria-label="属性调试">
    <header class="pg-drawer__head">
      <div>
        <p class="pg-drawer__eyebrow">props console</p>
        <h2 class="pg-drawer__name">{{ entry.name }}</h2>
        <p class="pg-drawer__component">{{ entry.componentTitle }} · {{ dirtyCount }} 项已修改</p>
      </div>
      <button class="pg-icon-btn" type="button" aria-label="关闭属性调试" @click="emit('close')">×</button>
    </header>

    <div class="pg-drawer__filters">
      <input v-model="query" class="pg-search" type="search" placeholder="搜索属性 / 说明" />
    </div>

    <div class="pg-drawer__list">
      <section v-for="group in groups" :key="group.id" :class="groupClass(group.available)">
        <header class="pg-group__head">
          <span class="pg-group__title">{{ group.title }}</span>
          <span class="pg-group__count">{{ group.controls.length }}</span>
          <span v-if="!group.available" class="cp-lock">包未包含</span>
        </header>

        <div
          v-for="control in group.controls"
          :key="control.name"
          class="pg-prop"
          :class="{ 'is-muted': !controlEnabled(control) || !group.available }"
        >
          <div class="pg-prop__row">
            <button
              v-if="control.kind === 'switch'"
              class="pg-toggle"
              :class="{ 'is-on': switchValue(control) }"
              type="button"
              :aria-pressed="switchValue(control)"
              @click="toggleSwitch(control)"
            >
              <span class="pg-toggle__knob" />
            </button>

            <div class="pg-prop__label">
              <span class="pg-prop__name">{{ control.name }}</span>
              <span class="pg-prop__type">{{ control.type }}</span>
            </div>

            <div v-if="control.kind === 'select'" class="pg-prop__editor">
              <select class="pg-select" :value="textValue(control)" @change="handleSelect(control, $event)">
                <option value="">默认</option>
                <option v-for="option in control.options" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>

            <div v-else-if="control.kind === 'number'" class="pg-prop__editor">
              <input class="pg-input" type="number" :value="textValue(control)" @change="handleNumber(control, $event)" />
            </div>

            <div v-else-if="control.kind === 'color'" class="pg-prop__editor pg-prop__editor--color">
              <input class="pg-color" type="color" :value="textValue(control) || '#3366ff'" @input="handleColor(control, $event)" />
              <input class="pg-input" type="text" :value="textValue(control)" @change="handleText(control, $event)" />
            </div>

            <div v-else-if="control.kind === 'text'" class="pg-prop__editor">
              <input class="pg-input" type="text" :value="textValue(control)" @change="handleText(control, $event)" />
            </div>

            <span v-else-if="control.kind === 'switch'" class="pg-prop__value">{{ switchValue(control) }}</span>

            <button
              v-if="isOverridden(control)"
              class="pg-filter"
              type="button"
              title="恢复默认值"
              @click="resetControl(control)"
            >
              重置
            </button>
          </div>

          <p v-if="control.description" class="pg-prop__desc">{{ control.description }}</p>

          <div v-if="control.kind === 'json'" class="pg-prop__json">
            <textarea class="pg-json" :value="jsonText(control)" @change="handleJson(control, $event)" />
          </div>
        </div>
      </section>

      <p v-if="!matchedCount" class="pg-drawer__empty">没有匹配的属性</p>
    </div>

    <footer class="pg-drawer__foot">
      <p class="pg-drawer__stats">{{ dirtyCount }} / {{ entry.controls.length }} 项覆盖</p>
      <div class="pg-drawer__actions">
        <button class="pg-filter" type="button" :disabled="!dirtyCount" @click="emit('reset')">全部重置</button>
        <button class="pg-filter is-on" type="button" @click="emit('close')">完成</button>
      </div>
    </footer>
  </aside>
</template>
