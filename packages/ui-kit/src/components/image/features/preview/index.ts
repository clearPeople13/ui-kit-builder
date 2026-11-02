import { Teleport, h, onBeforeUnmount, ref, watch } from 'vue'
import type { UiFeature } from '../../../../shared/feature'
import './style.css'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function isSource(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function collectSources(props: Record<string, any>): string[] {
  const list = Array.isArray(props.previewSrcList) ? props.previewSrcList.filter(isSource) : []
  if (list.length) {
    return list
  }
  return isSource(props.src) ? [props.src] : []
}

export const imagePreviewFeature: UiFeature = {
  id: 'image.preview',
  props: {
    previewSrcList: { type: Array, default: () => [] },
    previewTeleported: { type: Boolean, default: true },
    initialIndex: { type: Number, default: 0 },
    infinite: { type: Boolean, default: true },
    zoomRate: { type: Number, default: 1.2 },
    minScale: { type: Number, default: 0.2 },
    maxScale: { type: Number, default: 7 },
    hideOnClickModal: { type: Boolean, default: false },
    showProgress: { type: Boolean, default: false },
    closeOnPressEscape: { type: Boolean, default: true }
  },
  setup(props, { attrs }) {
    const visible = ref(false)
    const currentIndex = ref(0)
    const scale = ref(1)

    function sources(): string[] {
      return collectSources(props)
    }

    function open(): void {
      const list = sources()
      if (!list.length) {
        return
      }
      currentIndex.value = clamp(Math.trunc(Number(props.initialIndex) || 0), 0, list.length - 1)
      scale.value = 1
      visible.value = true
    }

    function close(): void {
      visible.value = false
    }

    function go(step: number): void {
      const total = sources().length
      if (total < 2) {
        return
      }
      const next = currentIndex.value + step
      currentIndex.value = props.infinite ? (next + total) % total : clamp(next, 0, total - 1)
      scale.value = 1
    }

    function zoom(deltaY: number): void {
      const rate = Number(props.zoomRate) > 0 ? Number(props.zoomRate) : 1.2
      const next = deltaY < 0 ? scale.value * rate : scale.value / rate
      scale.value = clamp(next, Number(props.minScale) || 0.2, Number(props.maxScale) || 7)
    }

    function handleWheel(event: WheelEvent): void {
      event.preventDefault()
      zoom(event.deltaY)
    }

    function handleKeydown(event: KeyboardEvent): void {
      if (!visible.value) {
        return
      }
      if (event.key === 'Escape' && props.closeOnPressEscape !== false) {
        close()
      } else if (event.key === 'ArrowLeft') {
        go(-1)
      } else if (event.key === 'ArrowRight') {
        go(1)
      }
    }

    watch(visible, (value) => {
      if (value) {
        window.addEventListener('keydown', handleKeydown)
      } else {
        window.removeEventListener('keydown', handleKeydown)
      }
    })

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeydown)
    })

    function renderOverlay() {
      const list = sources()
      const total = list.length
      const zIndex = Number(props.zIndex) || undefined
      const mask = h('div', {
        class: 'ui-image__preview-mask',
        onClick: () => {
          if (props.hideOnClickModal) {
            close()
          }
        }
      })
      const arrows =
        total > 1
          ? [
              h(
                'button',
                {
                  class: 'ui-image__preview-arrow is-prev',
                  type: 'button',
                  'aria-label': 'Previous',
                  onClick: () => go(-1)
                },
                '‹'
              ),
              h(
                'button',
                {
                  class: 'ui-image__preview-arrow is-next',
                  type: 'button',
                  'aria-label': 'Next',
                  onClick: () => go(1)
                },
                '›'
              )
            ]
          : []
      return h(
        'div',
        {
          class: 'ui-image__preview',
          style: zIndex ? { zIndex } : undefined,
          role: 'dialog',
          'aria-modal': 'true',
          onClick: (event: MouseEvent) => event.stopPropagation()
        },
        [
          mask,
          h('div', { class: 'ui-image__preview-body' }, [
            h('img', {
              class: 'ui-image__preview-img',
              src: list[currentIndex.value],
              alt: props.alt || '',
              draggable: false,
              style: { transform: `scale(${scale.value})` },
              onWheel: handleWheel
            }),
            ...arrows
          ]),
          h('div', { class: 'ui-image__preview-header' }, [
            props.showProgress && total > 1
              ? h('span', { class: 'ui-image__preview-progress' }, `${currentIndex.value + 1} / ${total}`)
              : null,
            h(
              'button',
              {
                class: 'ui-image__preview-close',
                type: 'button',
                'aria-label': 'Close',
                onClick: close
              },
              '×'
            )
          ])
        ]
      )
    }

    return {
      class: () => (sources().length ? 'is-previewable' : undefined),
      attrs: () => ({
        onClick: (event: MouseEvent) => {
          if (typeof attrs.onClick === 'function') {
            attrs.onClick(event)
          }
          open()
        }
      }),
      suffix: () => {
        if (!visible.value) {
          return null
        }
        const overlay = renderOverlay()
        return props.previewTeleported === false ? overlay : h(Teleport, { to: 'body' }, [overlay])
      }
    }
  }
}
