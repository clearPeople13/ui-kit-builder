import type { VNode, VNodeChild } from 'vue'
import { cloneVNode, isVNode } from 'vue'
import type { UiFeature } from '../../../../shared/feature'
import './style.css'

const TAG_CLASS = 'ui-input-tag__tag'
const DRAG_CLASS = 'is-dragging'
const DROP_CLASS = 'is-drop-target'

function isTagVNode(vnode: VNode): boolean {
  const value = vnode.props?.class
  const classes = Array.isArray(value) ? value.join(' ') : String(value ?? '')
  return classes.split(/\s+/).includes(TAG_CLASS)
}

export const inputTagDraggableFeature: UiFeature = {
  id: 'input-tag.draggable',
  props: {
    draggable: { type: Boolean }
  },
  setup(props, { emit, root }) {
    let dragIndex = -1

    function tags(): unknown[] {
      return Array.isArray(props.modelValue) ? props.modelValue : []
    }

    function scope(): ParentNode {
      return root?.value instanceof HTMLElement ? root.value : document
    }

    function clearMarks(): void {
      scope()
        .querySelectorAll(`.${TAG_CLASS}.${DRAG_CLASS}, .${TAG_CLASS}.${DROP_CLASS}`)
        .forEach((element) => element.classList.remove(DRAG_CLASS, DROP_CLASS))
    }

    function clearDropMarks(): void {
      scope()
        .querySelectorAll(`.${TAG_CLASS}.${DROP_CLASS}`)
        .forEach((element) => element.classList.remove(DROP_CLASS))
    }

    function moveTag(from: number, to: number): void {
      const list = tags()
      if (from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) {
        return
      }
      const next = [...list]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      emit('update:modelValue', next)
      emit('change', next)
    }

    function onDragStart(event: DragEvent, index: number): void {
      if (!props.draggable || props.disabled) {
        event.preventDefault()
        return
      }
      dragIndex = index
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(index))
      }
      const element = event.currentTarget as HTMLElement | null
      element?.classList.add(DRAG_CLASS)
    }

    function onDragOver(event: DragEvent): void {
      if (dragIndex < 0) {
        return
      }
      event.preventDefault()
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
      }
      const element = event.currentTarget as HTMLElement | null
      if (!element || element.classList.contains(DROP_CLASS)) {
        return
      }
      clearDropMarks()
      element.classList.add(DROP_CLASS)
    }

    function onDragEnd(): void {
      dragIndex = -1
      clearMarks()
    }

    function onDrop(event: DragEvent, index: number): void {
      event.preventDefault()
      const fallback = Number(event.dataTransfer?.getData('text/plain'))
      const from = dragIndex >= 0 ? dragIndex : fallback
      dragIndex = -1
      moveTag(from, index)
      clearMarks()
    }

    function decorate(content: VNodeChild): VNodeChild {
      if (!props.draggable || props.disabled || !Array.isArray(content)) {
        return content
      }
      let index = 0
      return content.map((child) => {
        if (!isVNode(child) || !isTagVNode(child)) {
          return child
        }
        const tagIndex = index++
        return cloneVNode(child, {
          draggable: 'true',
          'data-tag-index': tagIndex,
          onDragstart: (event: DragEvent) => onDragStart(event, tagIndex),
          onDragover: onDragOver,
          onDragend: onDragEnd,
          onDrop: (event: DragEvent) => onDrop(event, tagIndex)
        })
      })
    }

    return {
      class: () => (props.draggable ? 'ui-input-tag--draggable' : undefined),
      transformContent(content) {
        return decorate(content)
      }
    }
  }
}
