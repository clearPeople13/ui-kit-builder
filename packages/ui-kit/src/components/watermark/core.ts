import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import './core.css'

const watermarkBaseProps = {
  zIndex: { type: Number, default: 9 },
  rotate: { type: Number, default: -22 },
  width: { type: Number },
  height: { type: Number },
  image: { type: String },
  content: { type: [String, Array], default: 'UI Kit' },
  font: { type: Object },
  gap: { type: Array, default: () => [] }
}

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;'
}

function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => XML_ENTITIES[char] ?? char)
}

function svgDataUri(props: Record<string, any>): string {
  const font = props.font ?? {}
  const content = Array.isArray(props.content) ? props.content : [props.content ?? '']
  const color = font.color ?? 'rgba(0, 0, 0, 0.12)'
  const size = Number(font.fontSize ?? 16)
  const weight = font.fontWeight ?? 'normal'
  const family = font.fontFamily ?? 'sans-serif'
  const width = Number(props.width ?? 160)
  const height = Number(props.height ?? 120)
  const rotate = Number(props.rotate ?? -22)
  const lineHeight = Math.round(size * 1.35)
  const centerY = height / 2
  const offset = ((content.length - 1) * lineHeight) / 2
  const lines = content
    .map(
      (line: unknown, index: number) =>
        `<tspan x="${width / 2}" y="${centerY - offset + index * lineHeight + size * 0.35}">${escapeXml(String(line))}</tspan>`
    )
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g transform="rotate(${rotate} ${width / 2} ${height / 2})"><text text-anchor="middle" fill="${escapeXml(color)}" font-size="${size}" font-weight="${escapeXml(String(weight))}" font-family="${escapeXml(String(family))}">${lines}</text></g></svg>`
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`
}

export function createWatermark(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiWatermark',
      baseClass: 'ui-watermark',
      props: watermarkBaseProps,
      styles: (_props) => ({
        position: 'relative',
        overflow: 'hidden'
      }),
      content: ({ props, slots }) => {
        const gap = Array.isArray(props.gap) ? props.gap : []
        const width = Number(props.width ?? 160) + Number(gap[0] ?? 0)
        const height = Number(props.height ?? 120) + Number(gap[1] ?? 0)
        const offset = Array.isArray(props.offset) ? props.offset : []
        const offsetX = Number(offset[0]) || 0
        const offsetY = Number(offset[1]) || 0
        const image = typeof props.image === 'string' ? props.image.trim() : ''
        const backgroundImage = image ? `url("${image.replace(/"/g, '%22')}")` : svgDataUri(props)
        return [
          h('div', { class: 'ui-watermark__content' }, [slots.default?.() ?? null]),
          h('div', {
            class: 'ui-watermark__layer',
            style: {
              position: 'absolute',
              inset: '0',
              zIndex: Number(props.zIndex ?? 9),
              pointerEvents: 'none',
              backgroundImage,
              backgroundSize: `${width}px ${height}px`,
              backgroundPosition: offsetX || offsetY ? `${offsetX}px ${offsetY}px` : undefined,
              backgroundRepeat: 'repeat'
            }
          })
        ]
      }
    },
    features
  )
}
