<script setup lang="ts">
import { computed, ref } from 'vue'
import { ICON_GROUPS, ICON_LIBRARY } from '../icon-library'
import { resolveKitComponent } from '../playground-preview'

defineOptions({ name: 'IconLibrary' })

const props = defineProps<{
  packageId: string
  activeName: string
}>()

const emit = defineEmits<{
  select: [name: string]
}>()

const ICON_PREVIEW_SIZE = 20
const ICON_PREVIEW_STROKE = 1.8

const query = ref('')
const activeGroup = ref(ICON_GROUPS[0])

const iconComponent = computed(() => resolveKitComponent(props.packageId, 'Icon'))

const filteredIcons = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return ICON_LIBRARY.filter((icon) => {
    if (activeGroup.value !== ICON_GROUPS[0] && icon.group !== activeGroup.value) {
      return false
    }
    if (!keyword) {
      return true
    }
    return icon.name.toLowerCase().includes(keyword) || icon.label.toLowerCase().includes(keyword)
  })
})

function groupClass(group: string): string {
  return group === activeGroup.value ? 'icon-library__group is-active' : 'icon-library__group'
}

function iconClass(name: string): string {
  return name === props.activeName ? 'icon-library__item is-active' : 'icon-library__item'
}

function selectGroup(group: string): void {
  activeGroup.value = group
}

function selectIcon(name: string): void {
  emit('select', name)
}
</script>

<template>
  <div class="icon-library">
    <div class="icon-library__bar">
      <input v-model="query" class="icon-library__search" type="search" placeholder="搜索图标名称或中文说明" />
      <span class="icon-library__count">{{ filteredIcons.length }} / {{ ICON_LIBRARY.length }}</span>
    </div>

    <div class="icon-library__groups">
      <button
        v-for="group in ICON_GROUPS"
        :key="group"
        :class="groupClass(group)"
        type="button"
        @click="selectGroup(group)"
      >
        {{ group }}
      </button>
    </div>

    <div v-if="iconComponent" class="icon-library__grid">
      <button
        v-for="icon in filteredIcons"
        :key="icon.name"
        :class="iconClass(icon.name)"
        type="button"
        :title="`套用 ${icon.name}`"
        @click="selectIcon(icon.name)"
      >
        <component
          :is="iconComponent"
          :name="icon.name"
          :size="ICON_PREVIEW_SIZE"
          :stroke-width="ICON_PREVIEW_STROKE"
        />
        <span class="icon-library__label">{{ icon.label }}</span>
        <span class="icon-library__name">{{ icon.name }}</span>
      </button>
    </div>

    <p v-else class="icon-library__empty">当前包没有 Icon 导出，无法预览图标。</p>
    <p v-if="iconComponent && !filteredIcons.length" class="icon-library__empty">没有匹配的图标</p>
  </div>
</template>

<style scoped>
.icon-library {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--ui-border-color-lighter, #e4e7ed);
  border-radius: 12px;
  background: #fff;
}

.icon-library__bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-library__search {
  flex: 1;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--ui-border-color, #dcdfe6);
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}

.icon-library__search:focus {
  border-color: var(--ui-color-primary, #409eff);
}

.icon-library__count {
  color: var(--ui-color-info, #909399);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.icon-library__groups {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-library__group {
  padding: 4px 10px;
  border: 1px solid var(--ui-border-color-lighter, #e4e7ed);
  border-radius: 999px;
  background: #fff;
  color: var(--ui-color-info, #909399);
  font-size: 12px;
  cursor: pointer;
}

.icon-library__group.is-active {
  border-color: var(--ui-color-primary, #409eff);
  background: rgba(64, 158, 255, 0.08);
  color: var(--ui-color-primary, #409eff);
}

.icon-library__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
  max-height: 340px;
  overflow-y: auto;
  padding-right: 4px;
}

.icon-library__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px 10px;
  border: 1px solid var(--ui-border-color-lighter, #e4e7ed);
  border-radius: 10px;
  background: #fff;
  color: var(--ui-color-text, #303133);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, box-shadow 0.2s;
}

.icon-library__item:hover {
  border-color: var(--ui-color-primary, #409eff);
  color: var(--ui-color-primary, #409eff);
}

.icon-library__item.is-active {
  border-color: var(--ui-color-primary, #409eff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.16);
  color: var(--ui-color-primary, #409eff);
}

.icon-library__label {
  font-size: 12px;
}

.icon-library__name {
  max-width: 100%;
  overflow: hidden;
  color: var(--ui-color-info, #909399);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-library__empty {
  margin: 0;
  padding: 12px 0;
  color: var(--ui-color-info, #909399);
  font-size: 13px;
  text-align: center;
}
</style>
