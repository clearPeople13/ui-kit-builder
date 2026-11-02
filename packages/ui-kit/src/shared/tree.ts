export interface UiTreeFieldMapping {
  label?: string
  children?: string
  disabled?: string
  isLeaf?: string
}

export interface UiTreeNode {
  key: string | number
  label: string
  value: any
  disabled: boolean
  isLeaf: boolean
  level: number
  children: UiTreeNode[]
  raw: Record<string, any>
}

export function normalizeTreeNodes(data: unknown, fields: UiTreeFieldMapping = {}, level = 0): UiTreeNode[] {
  if (!Array.isArray(data)) {
    return []
  }
  const labelKey = fields.label ?? 'label'
  const childrenKey = fields.children ?? 'children'
  const disabledKey = fields.disabled ?? 'disabled'
  const isLeafKey = fields.isLeaf ?? 'isLeaf'
  return data.map((item, index) => {
    const record = item && typeof item === 'object' ? (item as Record<string, any>) : { label: item }
    const children = normalizeTreeNodes(record[childrenKey], fields, level + 1)
    return {
      key: record.key ?? record.id ?? record.value ?? `${level}-${index}`,
      label: String(record[labelKey] ?? record.label ?? record.value ?? ''),
      value: record.value ?? record.id ?? record.key ?? record[labelKey],
      disabled: Boolean(record[disabledKey]),
      isLeaf: record[isLeafKey] !== undefined ? Boolean(record[isLeafKey]) : children.length === 0,
      level,
      children,
      raw: record
    }
  })
}

export function flattenTreeNodes(nodes: UiTreeNode[], expandedKeys: Set<string | number>): UiTreeNode[] {
  const result: UiTreeNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children.length && expandedKeys.has(node.key)) {
      result.push(...flattenTreeNodes(node.children, expandedKeys))
    }
  }
  return result
}

export function collectTreeKeys(nodes: UiTreeNode[]): Array<string | number> {
  const keys: Array<string | number> = []
  for (const node of nodes) {
    keys.push(node.key)
    keys.push(...collectTreeKeys(node.children))
  }
  return keys
}

export function collectDescendantKeys(node: UiTreeNode): Array<string | number> {
  const keys: Array<string | number> = []
  for (const child of node.children) {
    keys.push(child.key)
    keys.push(...collectDescendantKeys(child))
  }
  return keys
}
