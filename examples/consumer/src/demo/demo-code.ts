import type { PlaygroundControl, PlaygroundEntry } from './playground'
import { resolvePresetValue } from './presets'
import type { SceneView } from './scenes'
import { makeHeavyRows, makeHeavyTreeRows, makeSubsTreeRows } from './table-data'
import { tableSceneBlueprint, type TableColumnSpec } from './table-demo'

export function kebabCase(name: string): string {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

const RESERVED_IDENTIFIERS = new Set(['ref'])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 大数据选项在示例代码里只输出生成器调用，不内联近 MB 级字面量（与 Table 的 heavy 场景同一口径） */
function makeSelectOptions(count: number) {
  return Array.from({ length: count }, (_, index) => ({ label: `选项 ${index + 1}`, value: index + 1 }))
}

function toJsLiteral(value: unknown): string {
  if (value === undefined) {
    return 'undefined'
  }
  const json = JSON.stringify(value, null, 2)
  if (json === undefined) {
    return 'undefined'
  }
  const ident = /^[A-Za-z_$\u4e00-\u9fff][\w$\u4e00-\u9fff]*$/
  return json
    .replace(/"([^"\\]+)":/g, (_match, key: string) => {
      return ident.test(key) ? `${key}:` : _match
    })
    .replace(/"((?:[^"\\]|\\.)*)"/g, (_match, inner: string) => {
      const unescaped = inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      return `'${unescaped.replace(/'/g, "\\'")}'`
    })
}

function formatPrimitiveAttr(name: string, value: unknown, control: PlaygroundControl | undefined): string {
  if (value === undefined || value === null) {
    return ''
  }
  const kebab = kebabCase(name)
  if (typeof value === 'boolean') {
    if (!value) {
      return control && control.defaultValue === true ? `:${kebab}="false"` : ''
    }
    return kebab
  }
  if (typeof value === 'number') {
    return `:${kebab}="${value}"`
  }
  if (typeof value === 'string') {
    return value.includes('"') ? `:${kebab}='${value}'` : `${kebab}="${value}"`
  }
  return ''
}

function uniqueName(base: string, taken: Set<string>): string {
  let name = base
  let index = 2
  while (taken.has(name)) {
    name = `${base}${index}`
    index += 1
  }
  taken.add(name)
  return name
}

interface SourceParts {
  hoisted: string[]
  attrs: string[]
}

function buildSourceParts(entry: PlaygroundEntry, values: Record<string, unknown>, skip: Set<string>): SourceParts {
  const controlByName = new Map(entry.controls.map((control) => [control.name, control]))
  const hoisted: string[] = []
  const attrs: string[] = []
  for (const [name, value] of Object.entries(values)) {
    if (skip.has(name)) {
      continue
    }
    if (Array.isArray(value) || isPlainObject(value)) {
      if (!/^[A-Za-z_$\u4e00-\u9fff][\w$\u4e00-\u9fff]*$/.test(name)) {
        continue
      }
      hoisted.push(`const ${name} = ref(${toJsLiteral(value)})`)
      attrs.push(`:${kebabCase(name)}="${name}"`)
      continue
    }
    const attr = formatPrimitiveAttr(name, value, controlByName.get(name))
    if (attr) {
      attrs.push(attr)
    }
  }
  return { hoisted, attrs }
}

function indentLines(text: string, spaces: number): string[] {
  const pad = ' '.repeat(spaces)
  return text.split('\n').map((line) => `${pad}${line}`)
}

function columnSourceAttrs(spec: TableColumnSpec): string[] {
  const attrs: string[] = []
  if (spec.type) {
    attrs.push(`type="${spec.type}"`)
  }
  if (spec.prop) {
    attrs.push(`prop="${spec.prop}"`)
  }
  if (spec.label !== undefined) {
    attrs.push(`label="${spec.label}"`)
  }
  if (spec.width !== undefined) {
    attrs.push(`:width="${spec.width}"`)
  }
  if (spec.minWidth !== undefined) {
    attrs.push(`:min-width="${spec.minWidth}"`)
  }
  if (spec.fixed) {
    attrs.push(`fixed="${spec.fixed}"`)
  }
  if (spec.align) {
    attrs.push(`align="${spec.align}"`)
  }
  if (spec.headerAlign) {
    attrs.push(`header-align="${spec.headerAlign}"`)
  }
  if (spec.className) {
    attrs.push(`class-name="${spec.className}"`)
  }
  if (spec.labelClassName) {
    attrs.push(`label-class-name="${spec.labelClassName}"`)
  }
  if (spec.sortOrders) {
    attrs.push(`:sort-orders="['${spec.sortOrders.join("', '")}']"`)
  }
  if (spec.sortMethod === 'name-length') {
    attrs.push(':sort-method="nameLengthCompare"')
  }
  if (spec.indexMethod === 'sequence') {
    attrs.push(':index="sequenceIndex"')
  }
  if (spec.formatter === 'amount') {
    attrs.push(':formatter="formatAmountCell"')
  }
  if (spec.sortable) {
    attrs.push('sortable')
  }
  if (spec.showOverflowTooltip) {
    attrs.push('show-overflow-tooltip')
  }
  if (spec.selectable) {
    attrs.push(':selectable="selectableRow"')
  }
  if (spec.showCheckbox) {
    attrs.push(':show-checkbox="checkboxRow"')
  }
  return attrs
}

function columnCellSource(kind: NonNullable<TableColumnSpec['cell']>, prop?: string): string {
  const field = prop || 'name'
  if (kind === 'tag') {
    return [
      '<template #default="{ row }">',
      '  <Tag size="small" effect="light" :type="statusTagType(row.status)">{{ row.status }}</Tag>',
      '</template>'
    ].join('\n')
  }
  if (kind === 'progress') {
    return [
      '<template #default="{ row }">',
      '  <Progress :percentage="row.progress" :width="96" :stroke-width="6" />',
      '</template>'
    ].join('\n')
  }
  if (kind === 'amount') {
    return '<template #default="{ row }">{{ formatAmount(row.amount) }}</template>'
  }
  if (kind === 'actions') {
    return [
      '<template #default>',
      '  <span class="table-actions">',
      '    <Button link type="primary" size="small">查看</Button>',
      '    <Button link size="small">编辑</Button>',
      '  </span>',
      '</template>'
    ].join('\n')
  }
  if (kind === 'desc') {
    return '<template #default="{ row }"><div class="table-desc">{{ row.desc }}</div></template>'
  }
  if (kind === 'edit-input') {
    return [
      '<template #default="{ row }">',
      `  <Input :model-value="row.${field}" placeholder="请输入" @update:model-value="updateRow(row, '${field}', $event)" />`,
      '</template>'
    ].join('\n')
  }
  if (kind === 'edit-select') {
    const options = field === 'status' ? 'STATUS_OPTIONS' : 'CITY_OPTIONS'
    return [
      '<template #default="{ row }">',
      `  <Select :model-value="row.${field}" :options="${options}" placeholder="请选择" @update:model-value="updateRow(row, '${field}', $event)" />`,
      '</template>'
    ].join('\n')
  }
  if (kind === 'edit-number') {
    return [
      '<template #default="{ row }">',
      `  <InputNumber :model-value="row.${field}" :min="0" @update:model-value="updateRow(row, '${field}', $event)" />`,
      '</template>'
    ].join('\n')
  }
  if (kind === 'edit-date') {
    return [
      '<template #default="{ row }">',
      `  <DatePicker :model-value="row.${field}" placeholder="选择日期" @update:model-value="updateRow(row, '${field}', $event)" />`,
      '</template>'
    ].join('\n')
  }
  if (kind === 'edit-slider') {
    return [
      '<template #default="{ row }">',
      `  <Slider :model-value="row.${field}" :show-tooltip="false" @update:model-value="updateRow(row, '${field}', $event)" />`,
      '</template>'
    ].join('\n')
  }
  if (kind === 'edit-actions') {
    return [
      '<template #default="{ row }">',
      '  <span class="table-edit-actions">',
      '    <Button link type="primary" size="small" :disabled="!row.dirty" @click="saveRow(row)">保存</Button>',
      '    <Button link size="small" :disabled="!row.dirty" @click="resetRow(row)">重置</Button>',
      '  </span>',
      '</template>'
    ].join('\n')
  }
  return [
    '<template #default="{ row }">',
    '  <div class="table-expand">',
    '    <div class="table-expand__item"><span class="table-expand__label">负责人</span><span>{{ row.owner }}</span></div>',
    '    <div class="table-expand__item"><span class="table-expand__label">需求数</span><span>{{ row.orders }}</span></div>',
    '    <div class="table-expand__item"><span class="table-expand__label">进度</span><span>{{ row.progress }}%</span></div>',
    '    <div class="table-expand__remark"><span class="table-expand__label">说明</span><span>{{ row.remark }}</span></div>',
    '  </div>',
    '</template>'
  ].join('\n')
}

function columnHeaderSource(): string {
  return [
    '<template #header="{ column }">',
    '  <span class="table-header">{{ column.label }} <Tag size="small" type="info" effect="plain">核心</Tag></span>',
    '</template>'
  ].join('\n')
}

function columnSourceLines(spec: TableColumnSpec): string[] {
  const attrs = columnSourceAttrs(spec)
  const open = `<TableColumn${attrs.length ? ` ${attrs.join(' ')}` : ''}`
  const children: string[] = []
  if (spec.headerExtra) {
    children.push(columnHeaderSource())
  }
  if (spec.cell) {
    children.push(columnCellSource(spec.cell, spec.prop))
  }
  if (!children.length) {
    return [`${open} />`]
  }
  const lines = [`${open}>`]
  for (const child of children) {
    lines.push(...indentLines(child, 2))
  }
  lines.push('</TableColumn>')
  return lines
}

function emptyStateSource(): string {
  return [
    '<template #empty>',
    '  <Empty description="没有匹配的项目，试试调整筛选条件">',
    '    <Button type="primary" size="small">重置筛选</Button>',
    '  </Empty>',
    '</template>'
  ].join('\n')
}

function tableOpenTag(attrs: string[]): string[] {
  const inline = `  <Table ${attrs.join(' ')}>`
  if (inline.length <= 88) {
    return [inline]
  }
  return ['  <Table', ...attrs.map((attr) => `    ${attr}`), '  >']
}

function tableSource(entry: PlaygroundEntry, scene: SceneView | undefined): string {
  const sceneId = scene?.id ?? 'base'
  const values: Record<string, unknown> = { ...(scene?.values ?? {}) }
  const editableScene = sceneId === 'editable' || sceneId === 'editable-heavy'
  const emptyScene = sceneId === 'empty' || sceneId === 'empty-text' || sceneId === 'empty-slot'
  const eventsScene = sceneId === 'events'
  const treeScene = [
    'tree',
    'tree-expanded',
    'tree-select',
    'tree-select-strict',
    'tree-indent',
    'heavy-tree'
  ].includes(sceneId)
  const subsScene = sceneId === 'tree-props'
  const heavyRows = typeof values.heavyRows === 'number' ? values.heavyRows : 5000
  // data 可能是惰性工厂（heavy 场景）：解析出真实数组，工厂带缓存，与渲染共享同一份
  const resolvedData = resolvePresetValue(values.data)
  const rows = Array.isArray(resolvedData) ? resolvedData : []
  delete values.data
  delete values.heavyRows
  const rowKey = typeof values.rowKey === 'string' ? values.rowKey : 'id'
  delete values.rowKey

  const parts = buildSourceParts(entry, values, new Set())
  const tableAttrs = [emptyScene ? ':data="filteredRows"' : ':data="rows"', `row-key="${rowKey}"`, ...parts.attrs]
  if (sceneId === 'span' || sceneId === 'editable-heavy') {
    tableAttrs.push(':span-method="spanMethod"')
  }
  if (sceneId === 'row-style') {
    tableAttrs.push(':row-class-name="rowClassName"', ':row-style="rowStyle"')
  }
  if (sceneId === 'summary-method') {
    tableAttrs.push(':summary-method="summaryMethod"')
  }
  if (eventsScene) {
    tableAttrs.push(
      '@row-click="logEvent(\'row-click\', $event)"',
      '@current-change="logEvent(\'current-change\', $event)"',
      '@sort-change="logEvent(\'sort-change\', $event)"',
      '@resize-change="logEvent(\'resize-change\', $event)"',
      '@selection-change="logEvent(\'selection-change\', $event)"'
    )
  }
  if (sceneId === 'methods' || eventsScene) {
    tableAttrs.push('ref="tableRef"')
  }

  const blueprint = tableSceneBlueprint(sceneId)
  const imports = new Set(['Table', 'TableColumn'])
  for (const spec of blueprint) {
    if (spec.cell === 'tag' || spec.headerExtra) {
      imports.add('Tag')
    }
    if (spec.cell === 'progress') {
      imports.add('Progress')
    }
    if (spec.cell === 'actions' || spec.cell === 'edit-actions') {
      imports.add('Button')
    }
    if (spec.cell === 'edit-input') {
      imports.add('Input')
    }
    if (spec.cell === 'edit-select') {
      imports.add('Select')
    }
    if (spec.cell === 'edit-number') {
      imports.add('InputNumber')
    }
    if (spec.cell === 'edit-date') {
      imports.add('DatePicker')
    }
    if (spec.cell === 'edit-slider') {
      imports.add('Slider')
    }
  }
  if (sceneId === 'empty-slot') {
    imports.add('Empty')
    imports.add('Button')
  }
  if (emptyScene) {
    imports.add('Input')
  }
  if (sceneId === 'methods' || eventsScene) {
    imports.add('Button')
  }

  // 大数据示例只输出生成器调用，不内联数据本身：树形场景根节点只有 20 个，
  // 按顶层长度判断兜不住，展开后是 5220 行、序列化近 4MB，代码高亮会同步阻塞数秒
  const heavyRowSource = subsScene
    ? `const rows = ref((${makeSubsTreeRows.toString()})())`
    : treeScene
      ? `const rows = ref((${makeHeavyTreeRows.toString()})())`
      : editableScene
        ? `const rows = ref((${makeHeavyRows.toString()})(${heavyRows}).map((row) => ({ ...row, dirty: false })))`
        : rows.length > 500
          ? `const rows = ref((${makeHeavyRows.toString()})(${rows.length}))`
          : `const rows = ref(${toJsLiteral(rows)})`
  const hoisted = [heavyRowSource, ...parts.hoisted]
  if (blueprint.some((spec) => spec.cell === 'tag')) {
    hoisted.push("const STATUS_TAG_TYPE = { 稳定: 'success', 内测: 'warning', 规划: 'info' }")
    hoisted.push('function statusTagType(status) {', "  return STATUS_TAG_TYPE[status] ?? 'info'", '}')
  }
  if (blueprint.some((spec) => spec.cell === 'amount')) {
    hoisted.push(
      'function formatAmount(value) {',
      '  const amount = Number(value)',
      "  return Number.isFinite(amount) ? `¥${amount.toLocaleString('zh-CN')}` : ''",
      '}'
    )
  }
  if (blueprint.some((spec) => spec.selectable)) {
    hoisted.push('function selectableRow(row) {', "  return row.status !== '规划'", '}')
  }
  if (blueprint.some((spec) => spec.showCheckbox)) {
    hoisted.push('function checkboxRow(row) {', "  return row.status !== '规划'", '}')
  }
  if (sceneId === 'span') {
    hoisted.push(
      'const GROUP_SIZE = 5',
      'function spanMethod({ rowIndex, columnIndex }) {',
      '  if (columnIndex !== 0) {',
      '    return',
      '  }',
      '  if (rowIndex % GROUP_SIZE !== 0) {',
      '    return [0, 0]',
      '  }',
      '  return [Math.min(GROUP_SIZE, rows.value.length - rowIndex), 1]',
      '}'
    )
  }
  if (sceneId === 'row-style') {
    hoisted.push(
      'function rowClassName({ row }) {',
      "  return row.status === '规划' ? 'table-row--muted' : ''",
      '}',
      'function rowStyle({ row }) {',
      "  return Number(row.orders) >= 100 ? { fontWeight: '600' } : undefined",
      '}'
    )
  }
  if (sceneId === 'editable-heavy') {
    hoisted.push(
      'const HEAVY_GROUP_SIZE = 10',
      'function spanMethod({ rowIndex, columnIndex }) {',
      '  if (columnIndex !== 2) {',
      '    return',
      '  }',
      '  if (rowIndex % HEAVY_GROUP_SIZE !== 0) {',
      '    return [0, 0]',
      '  }',
      '  return [Math.min(HEAVY_GROUP_SIZE, rows.value.length - rowIndex), 1]',
      '}'
    )
  }
  if (sceneId === 'editable' || sceneId === 'editable-heavy') {
    hoisted.push(
      "const CITY_OPTIONS = ['上海', '杭州', '成都', '深圳', '北京', '武汉', '南京', '西安', '苏州', '广州'].map((city) => ({ label: city, value: city }))",
      "const STATUS_OPTIONS = ['稳定', '内测', '规划'].map((status) => ({ label: status, value: status }))",
      'const origin = new Map(rows.value.map((row) => [row.id, { ...row }]))',
      'function updateRow(row, field, value) {',
      '  row[field] = value',
      '  row.dirty = true',
      '}',
      'function saveRow(row) {',
      '  row.dirty = false',
      '}',
      'function resetRow(row) {',
      '  Object.assign(row, origin.get(row.id), { dirty: false })',
      '}'
    )
  }
  if (sceneId === 'methods') {
    hoisted.push(
      'const tableRef = ref()',
      'const selectedRows = ref([])',
      'function selectAll() {',
      '  tableRef.value?.toggleAllSelection()',
      '}',
      'function clearAll() {',
      '  tableRef.value?.clearSelection()',
      '}',
      'function onSelectionChange(rows) {',
      '  selectedRows.value = rows',
      '}'
    )
  }

  if (sceneId === 'summary-method') {
    hoisted.push(
      'function summaryMethod({ columns, data }) {',
      '  return columns.map((column, index) => {',
      '    if (index === 0) {',
      '      return `统计（${data.length} 行）`',
      '    }',
      "    if (column.prop === 'orders') {",
      '      return data.reduce((sum, row) => sum + (Number(row.orders) || 0), 0)',
      '    }',
      "    if (column.prop === 'amount') {",
      '      const total = data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)',
      '      return data.length ? Math.round(total / data.length) : 0',
      '    }',
      "    return ''",
      '  })',
      '}'
    )
  }
  if (blueprint.some((spec) => spec.sortMethod)) {
    hoisted.push(
      'function nameLengthCompare(left, right) {',
      "  return String(left.name ?? '').length - String(right.name ?? '').length || Number(left.id) - Number(right.id)",
      '}'
    )
  }
  if (blueprint.some((spec) => spec.indexMethod)) {
    hoisted.push('function sequenceIndex(index) {', '  return (index + 1) * 10', '}')
  }
  if (blueprint.some((spec) => spec.formatter)) {
    hoisted.push(
      'function formatAmountCell(row, column, value) {',
      '  const amount = Number(value)',
      "  return Number.isFinite(amount) ? `¥${amount.toLocaleString('zh-CN')}` : ''",
      '}'
    )
  }
  if (emptyScene) {
    hoisted.push(
      "const emptyQuery = ref('不存在的关键字')",
      'const filteredRows = computed(() => {',
      '  const query = emptyQuery.value.trim()',
      '  return query ? rows.value.filter((row) => String(row.name).includes(query)) : rows.value',
      '})'
    )
  }
  if (eventsScene) {
    hoisted.push(
      'const tableRef = ref()',
      'const eventLog = ref([])',
      'function describeEvent(name, payload) {',
      "  if (name === 'selection-change') {",
      '    return `${payload.length} 行`',
      '  }',
      "  if (name === 'sort-change') {",
      "    return `${payload.prop} ${payload.order || '取消'}`",
      '  }',
      "  if (name === 'resize-change') {",
      '    return `${payload.key} → ${Math.round(payload.width)}px`',
      '  }',
      "  return `#${payload.id} ${payload.name ?? ''}`",
      '}',
      'function logEvent(name, payload) {',
      '  eventLog.value = [{ name, detail: describeEvent(name, payload) }, ...eventLog.value].slice(0, 6)',
      '}'
    )
  }

  const columnLines: string[] = []
  for (const spec of blueprint) {
    columnLines.push(...indentLines(columnSourceLines(spec).join('\n'), 4))
  }
  if (sceneId === 'empty-slot') {
    columnLines.push(...indentLines(emptyStateSource(), 4))
  }

  const vueImports = emptyScene ? "import { computed, ref } from 'vue'" : "import { ref } from 'vue'"
  const script = [vueImports, `import { ${[...imports].join(', ')} } from '@demo/ui-kit'`, '', ...hoisted]

  const innerOpen = tableOpenTag(tableAttrs).map((line) => `  ${line}`)
  const innerColumns = columnLines.map((line) => `  ${line}`)

  if (sceneId === 'methods') {
    return [
      '<script setup>',
      ...script,
      '</' + 'script>',
      '',
      '<template>',
      '  <div class="table-methods">',
      '    <div class="table-methods__bar">',
      '      <Button size="small" type="primary" @click="selectAll">全选 / 取消全选</Button>',
      '      <Button size="small" @click="clearAll">清空选择</Button>',
      '      <span class="table-methods__count">已选 {{ selectedRows.length }} 行</span>',
      '    </div>',
      ...innerOpen,
      ...innerColumns,
      '    </Table>',
      '  </div>',
      '</template>',
      ''
    ].join('\n')
  }

  if (emptyScene) {
    return [
      '<script setup>',
      ...script,
      '</' + 'script>',
      '',
      '<template>',
      '  <div class="table-scene">',
      '    <div class="table-scene__bar">',
      '      <Input v-model="emptyQuery" clearable placeholder="按模块名筛选 5000 行数据，清空显示全部" style="width: 320px" />',
      '      <span class="table-methods__count">命中 {{ filteredRows.length }} / {{ rows.length }} 行</span>',
      '    </div>',
      ...innerOpen.map((line) => `  ${line}`),
      ...innerColumns.map((line) => `  ${line}`),
      '    </Table>',
      '  </div>',
      '</template>',
      ''
    ].join('\n')
  }

  if (eventsScene) {
    return [
      '<script setup>',
      ...script,
      '</' + 'script>',
      '',
      '<template>',
      '  <div class="table-scene">',
      '    <div class="table-scene__bar">',
      '      <span class="table-methods__count">事件日志（点击行 / 表头 / 拖列宽 / 勾选）</span>',
      '      <ul class="table-events">',
      '        <li v-for="(entry, index) in eventLog" :key="index">',
      '          <code>{{ entry.name }}</code>',
      '          <span>{{ entry.detail }}</span>',
      '        </li>',
      '        <li v-if="!eventLog.length" class="table-events__empty">暂无事件，试试点击一行或排序表头</li>',
      '      </ul>',
      '    </div>',
      ...innerOpen.map((line) => `  ${line}`),
      ...innerColumns.map((line) => `  ${line}`),
      '    </Table>',
      '  </div>',
      '</template>',
      ''
    ].join('\n')
  }

  return [
    '<script setup>',
    ...script,
    '</' + 'script>',
    '',
    '<template>',
    ...tableOpenTag(tableAttrs),
    ...columnLines,
    '  </Table>',
    '</template>',
    ''
  ].join('\n')
}

function tableColumnSource(entry: PlaygroundEntry, scene: SceneView | undefined): string {
  const values = scene?.values ?? {}
  const sceneId = scene?.id ?? ''
  const parts = buildSourceParts(entry, values, new Set())
  const extraAttrs: string[] = []
  const extraHoisted: string[] = []
  if (sceneId === 'index-method') {
    extraAttrs.push(':index="sequenceIndex"')
    extraHoisted.push('function sequenceIndex(index) {', '  return (index + 1) * 10', '}')
  }
  if (sceneId === 'formatter') {
    extraAttrs.push(':formatter="formatCell"')
    extraHoisted.push('function formatCell(row) {', "  return `¥${Number(row.amount).toLocaleString('zh-CN')}`", '}')
  }
  const targetAttrs = [...parts.attrs, ...extraAttrs]
  const target = `<TableColumn${targetAttrs.length ? ` ${targetAttrs.join(' ')}` : ''} />`
  const script = [
    "import { ref } from 'vue'",
    "import { Table, TableColumn } from '@demo/ui-kit'",
    '',
    `const rows = ref((${makeHeavyRows.toString()})(5000))`,
    ...parts.hoisted,
    ...extraHoisted
  ]
  return [
    '<script setup>',
    ...script,
    '</' + 'script>',
    '',
    '<template>',
    '  <Table :data="rows" row-key="id" :height="280" virtual>',
    '    <TableColumn prop="name" label="组件" :width="160" />',
    `    ${target}`,
    '    <TableColumn prop="city" label="城市" :width="100" />',
    '  </Table>',
    '</template>',
    ''
  ].join('\n')
}

export function sceneSourceCode(entry: PlaygroundEntry, scene: SceneView | undefined): string {
  if (entry.name === 'Table') {
    return tableSource(entry, scene)
  }
  if (entry.name === 'TableColumn') {
    return tableColumnSource(entry, scene)
  }
  const values = scene?.values ?? {}
  const controlByName = new Map(entry.controls.map((control) => [control.name, control]))

  const hoisted: string[] = []
  const attrs: string[] = []
  const taken = new Set<string>(RESERVED_IDENTIFIERS)
  taken.add(entry.name)

  const names = Object.keys(values).sort((a, b) => {
    if (a === 'modelValue') {
      return -1
    }
    if (b === 'modelValue') {
      return 1
    }
    return 0
  })

  for (const name of names) {
    const value = values[name]
    const control = controlByName.get(name)
    if (name === 'modelValue') {
      if (value === undefined || value === null) {
        continue
      }
      const refName = uniqueName('modelValue', taken)
      hoisted.push(`const ${refName} = ref(${toJsLiteral(value)})`)
      attrs.push(`v-model="${refName}"`)
      continue
    }
    if (Array.isArray(value) || isPlainObject(value)) {
      if (!/^[A-Za-z_$\u4e00-\u9fff][\w$\u4e00-\u9fff]*$/.test(name)) {
        continue
      }
      const refName = uniqueName(name, taken)
      const literal =
        entry.name === 'Select' && name === 'options' && Array.isArray(value) && value.length > 500
          ? `(${makeSelectOptions.toString()})(${value.length})`
          : toJsLiteral(value)
      hoisted.push(`const ${refName} = ref(${literal})`)
      attrs.push(`:${kebabCase(name)}="${refName}"`)
      continue
    }
    const attr = formatPrimitiveAttr(name, value, control)
    if (attr) {
      attrs.push(attr)
    }
  }

  const single = `<${entry.name}${attrs.length ? ` ${attrs.join(' ')}` : ''} />`
  let usage: string
  if (!attrs.length) {
    usage = single
  } else if (single.length <= 88) {
    usage = single
  } else {
    usage = `<${entry.name}\n${attrs.map((attr) => `  ${attr}`).join('\n')}\n/>`
  }

  const script: string[] = []
  if (hoisted.length) {
    script.push("import { ref } from 'vue'")
  }
  script.push(`import { ${entry.name} } from '@demo/ui-kit'`)
  if (hoisted.length) {
    script.push('')
    script.push(...hoisted)
  }

  return [
    '<script setup>',
    ...script,
    '</' + 'script>',
    '',
    '<template>',
    `  ${usage.replaceAll('\n', '\n  ')}`,
    '</template>',
    ''
  ].join('\n')
}
