import type { Ref } from 'vue'
import type { UiFeature } from '../../../../shared/feature'
import type { UiTreeNode } from '../../../../shared/tree'
import { collectDescendantKeys } from '../../../../shared/tree'
import './style.css'

type DropType = 'prev' | 'next' | 'inner'

const SOURCE_CLASS = 'is-drag-source'
const DROP_CLASSES: Record<DropType, string> = {
  prev: 'is-drop-prev',
  next: 'is-drop-next',
  inner: 'is-drop-inner'
}

function findList(list: UiTreeNode[], key: string | number): UiTreeNode[] | null {
  if (list.some((node) => node.key === key)) {
    return list
  }
  for (const node of list) {
    const found = findList(node.children, key)
    if (found) {
      return found
    }
  }
  return null
}

function applyLevel(node: UiTreeNode, level: number): void {
  node.level = level
  for (const child of node.children) {
    applyLevel(child, level + 1)
  }
}

function resolveDropType(event: DragEvent, element: HTMLElement): DropType {
  const rect = element.getBoundingClientRect()
  if (!rect.height) {
    return 'inner'
  }
  const ratio = (event.clientY - rect.top) / rect.height
  if (ratio < 0.25) {
    return 'prev'
  }
  return ratio > 0.75 ? 'next' : 'inner'
}

export const treeDraggableFeature: UiFeature = {
  id: 'tree.draggable',
  props: {
    draggable: { type: Boolean },
    allowDrag: { type: Function },
    allowDrop: { type: Function }
  },
  setup(props, { emit, root, state }) {
    let dragNode: UiTreeNode | null = null

    function scope(): ParentNode {
      return root?.value instanceof HTMLElement ? root.value : document
    }

    function nodes(): UiTreeNode[] {
      return (state?.nodes ?? []) as UiTreeNode[]
    }

    function expandedKeys(): Ref<Set<string | number>> | undefined {
      return state?.expandedKeys as Ref<Set<string | number>> | undefined
    }

    function clearMarks(): void {
      scope()
        .querySelectorAll('.ui-tree__node')
        .forEach((element) =>
          element.classList.remove(SOURCE_CLASS, DROP_CLASSES.prev, DROP_CLASSES.next, DROP_CLASSES.inner)
        )
    }

    function clearDropMarks(): void {
      scope()
        .querySelectorAll('.ui-tree__node')
        .forEach((element) => element.classList.remove(DROP_CLASSES.prev, DROP_CLASSES.next, DROP_CLASSES.inner))
    }

    function canDrop(source: UiTreeNode, target: UiTreeNode, type: DropType): boolean {
      if (!props.draggable || source.key === target.key || target.disabled) {
        return false
      }
      if (collectDescendantKeys(source).includes(target.key)) {
        return false
      }
      return props.allowDrop ? props.allowDrop(source.raw, target.raw, type) !== false : true
    }

    function expand(key: string | number): void {
      const keys = expandedKeys()
      if (!keys || keys.value.has(key)) {
        return
      }
      keys.value = new Set(keys.value).add(key)
    }

    // 新 Set 让树重新渲染，读取已调整的 children 顺序
    function refresh(): void {
      const keys = expandedKeys()
      if (keys) {
        keys.value = new Set(keys.value)
      }
    }

    function move(source: UiTreeNode, target: UiTreeNode, type: DropType): boolean {
      const sourceList = findList(nodes(), source.key)
      if (!sourceList) {
        return false
      }
      const targetList = type === 'inner' ? target.children : findList(nodes(), target.key)
      if (!targetList) {
        return false
      }
      sourceList.splice(sourceList.indexOf(source), 1)
      if (type === 'inner') {
        target.children.push(source)
        applyLevel(source, target.level + 1)
        expand(target.key)
      } else {
        const index = targetList.indexOf(target)
        targetList.splice(type === 'prev' ? index : index + 1, 0, source)
        applyLevel(source, target.level)
      }
      refresh()
      return true
    }

    function onDragStart(event: DragEvent, node: UiTreeNode): void {
      if (!props.draggable || node.disabled || (props.allowDrag && props.allowDrag(node.raw) === false)) {
        event.preventDefault()
        return
      }
      dragNode = node
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(node.key))
      }
      ;(event.currentTarget as HTMLElement | null)?.classList.add(SOURCE_CLASS)
      emit('node-drag-start', node.raw)
    }

    function onDragOver(event: DragEvent, node: UiTreeNode): void {
      if (!dragNode) {
        return
      }
      const element = event.currentTarget as HTMLElement | null
      if (!element) {
        return
      }
      const type = resolveDropType(event, element)
      if (!canDrop(dragNode, node, type)) {
        clearDropMarks()
        return
      }
      event.preventDefault()
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
      }
      clearDropMarks()
      element.classList.add(DROP_CLASSES[type])
    }

    function onDragLeave(event: DragEvent): void {
      const element = event.currentTarget as HTMLElement | null
      const related = event.relatedTarget as Node | null
      if (element && related && element.contains(related)) {
        return
      }
      clearDropMarks()
    }

    function onDrop(event: DragEvent, node: UiTreeNode): void {
      const source = dragNode
      if (!source) {
        return
      }
      const element = event.currentTarget as HTMLElement | null
      const type = element ? resolveDropType(event, element) : 'inner'
      const accepted = canDrop(source, node, type)
      if (accepted) {
        event.preventDefault()
      }
      const moved = accepted && move(source, node, type)
      clearMarks()
      dragNode = null
      if (!moved) {
        return
      }
      emit('node-drop', source.raw, node.raw, type)
      // 拖动后面板节点已重新渲染，原生 dragend 可能丢失，这里直接补发
      emit('node-drag-end', source.raw, node.raw, type)
    }

    function onDragEnd(): void {
      const source = dragNode
      if (!source) {
        return
      }
      dragNode = null
      clearMarks()
      emit('node-drag-end', source.raw, null, null)
    }

    function treeNodeProps(node: UiTreeNode): Record<string, any> {
      if (!props.draggable || node.disabled) {
        return {}
      }
      return {
        draggable: 'true',
        'data-tree-key': node.key,
        onDragstart: (event: DragEvent) => onDragStart(event, node),
        onDragover: (event: DragEvent) => onDragOver(event, node),
        onDragleave: onDragLeave,
        onDrop: (event: DragEvent) => onDrop(event, node),
        onDragend: onDragEnd
      }
    }

    return {
      class: () => (props.draggable ? 'ui-tree--draggable' : undefined),
      hooks: {
        treeNodeProps
      }
    }
  }
}
