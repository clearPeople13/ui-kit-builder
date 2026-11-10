import type { CSSProperties, VNodeChild } from 'vue'
import { Teleport, h, ref } from 'vue'
import type { UiFeature } from '../../../../shared/feature'
import { useFloatingPanel } from '../../../../shared/panel'
import './style.css'

interface CellScope {
  column?: Record<string, any>
  header?: boolean
  merged?: boolean
}

// 列级未声明（undefined）才继承表格级；false 是显式关闭。裸属性在列的原始 vnode props 里是空串
function resolveLineClamp(value: unknown): number {
  if (value === true || value === '') {
    return 1
  }
  if (value && typeof value === 'object') {
    const lines = Number((value as { lineClamp?: unknown }).lineClamp)
    return Number.isFinite(lines) && lines >= 1 ? Math.floor(lines) : 1
  }
  return 0
}

export const tableOverflowTooltipFeature: UiFeature = {
  id: 'table.overflow-tooltip',
  props: {
    // 默认值必须显式留 undefined：否则 Vue 会把未传的布尔特性转成 false，列级就无从继承表格级
    showOverflowTooltip: { type: [Object, Boolean], default: undefined }
  },
  setup(props) {
    const trigger = ref<HTMLElement>()
    const panel = ref<HTMLElement>()
    const open = ref(false)
    const text = ref('')

    const floating = useFloatingPanel({
      props: { panelScroll: 'close', zIndex: props.zIndex },
      open: () => open.value,
      close: () => {
        open.value = false
      },
      trigger,
      panel,
      placement: () => 'bottom',
      offset: () => 8
    })

    function linesOf(scope: CellScope): number {
      if (scope.merged) {
        return 0
      }
      const own = scope.column?.showOverflowTooltip
      const lines = resolveLineClamp(own === undefined ? props.showOverflowTooltip : own)
      // 表头是短标签，多行配置只作用于单元格内容；合并单元格的续格由 F-124 负责换行
      return scope.header ? Math.min(lines, 1) : lines
    }

    function overflows(element: HTMLElement): boolean {
      if (!element.classList.contains('is-clamped')) {
        return element.scrollWidth > element.clientWidth + 1
      }
      // -webkit-box 下 scrollHeight 只到钳制后的高度；换回普通块才量得到被裁行的真实高度（同一任务内还原，不会绘制中间态）
      const clampedHeight = element.clientHeight
      element.style.setProperty('display', 'block')
      const fullHeight = element.scrollHeight
      element.style.removeProperty('display')
      return fullHeight > clampedHeight + 1
    }

    function show(event: MouseEvent) {
      const cell = event.currentTarget as HTMLElement | null
      const content = cell?.querySelector<HTMLElement>('.ui-table__cell-text')
      if (!cell || !content || !content.textContent || !overflows(content)) {
        return
      }
      trigger.value = cell
      text.value = content.textContent
      open.value = true
      floating.refresh()
    }

    function hide() {
      open.value = false
    }

    function renderPanel(): VNodeChild {
      if (!open.value) {
        return null
      }
      return h(Teleport, { to: 'body' }, [
        h(
          'div',
          {
            ref: panel,
            class: ['ui-floating-panel', 'is-dark', 'ui-table__overflow-panel'],
            style: [
              floating.position.value,
              Object.keys(floating.position.value).length ? null : { visibility: 'hidden' }
            ],
            role: 'tooltip'
          },
          text.value
        )
      ])
    }

    return {
      hooks: {
        tableCellAttrs(scope: CellScope) {
          return linesOf(scope) ? { onMouseenter: show, onMouseleave: hide } : undefined
        },
        tableCellContent(content: VNodeChild, scope: CellScope) {
          const lines = linesOf(scope)
          if (!lines) {
            return content
          }
          return h(
            'span',
            {
              class: ['ui-table__cell-text', lines > 1 ? 'is-clamped' : ''],
              style: lines > 1 ? ({ '--ui-table-line-clamp': String(lines) } as CSSProperties) : undefined
            },
            [content]
          )
        }
      },
      suffix: renderPanel
    }
  }
}
