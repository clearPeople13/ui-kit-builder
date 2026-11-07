/**
 * options 规范化的唯一出口（G7-A23）。
 *
 * 历史上 segmented / select / behavior(select/checkbox/radio 原生列表) 各有一份
 * normalizeOptions，字段回退链与分组行为各自漂移；此处收拢为单一实现，
 * 组件侧只传映射与开关，不再复制函数体。
 */

export interface UiOption {
  label: string
  value: any
  disabled: boolean
  group?: boolean
}

export interface NormalizeOptionsConfig {
  /**
   * 展开 record[optionsKey] 为「组头 + 递归子项」。
   * 只有 select 的分组面板消费组头；扁平消费方保持关闭，
   * 否则恰好带 options 字段的普通对象会被误判成组头（checkbox/radio 的历史语义不允许变）。
   */
  groups?: boolean
}

function optionFieldKeys(mapping?: unknown): { label: string; value: string; disabled: string; options: string } {
  const record = mapping && typeof mapping === 'object' ? (mapping as Record<string, any>) : {}
  const pick = (key: string) => (typeof record[key] === 'string' && record[key] ? record[key] : key)
  return { label: pick('label'), value: pick('value'), disabled: pick('disabled'), options: pick('options') }
}

export function normalizeOptions(input: unknown, mapping?: unknown, config?: NormalizeOptionsConfig): UiOption[] {
  if (!Array.isArray(input)) {
    return []
  }
  const fields = optionFieldKeys(mapping)
  const result: UiOption[] = []
  for (const item of input) {
    if (!item || typeof item !== 'object') {
      result.push({ label: String(item), value: item, disabled: false })
      continue
    }
    const record = item as Record<string, any>
    if (config?.groups && Array.isArray(record[fields.options])) {
      result.push({
        label: String(record[fields.label] ?? ''),
        value: record[fields.label],
        disabled: true,
        group: true
      })
      result.push(...normalizeOptions(record[fields.options], mapping, config))
      continue
    }
    // 回退链取 behavior 版与 select 版的并集：映射键miss时先回退默认键再回退对侧键，
    // 两个旧实现在「自定义字段名 + 缺字段」场景下各有盲区，收拢后以更宽的一条链为准
    result.push({
      label: String(record[fields.label] ?? record[fields.value] ?? record.value ?? record.label ?? ''),
      value: record[fields.value] ?? record.value ?? record[fields.label] ?? record.label,
      disabled: Boolean(record[fields.disabled])
    })
  }
  return result
}
