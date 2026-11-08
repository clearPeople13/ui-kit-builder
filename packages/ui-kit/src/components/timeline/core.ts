import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import './core.css'

const timelineBaseProps = {
  mode: { type: String, default: 'start' },
  reverse: { type: Boolean }
}

export function createTimeline(features: UiFeature[] = []) {
  const base = wrapperConfig({
    name: 'UiTimeline',
    baseClass: 'ui-timeline',
    props: timelineBaseProps,
    defaultTag: 'div'
  })
  return createUiComponent(
    {
      ...base,
      attrs: () => ({ role: 'list' }),
      classes: (props, state) => [...(base.classes?.(props, state) ?? []), props.reverse ? 'is-reverse' : '']
    },
    features
  )
}

const timelineItemBaseProps = {
  type: { type: String, default: '' },
  size: { type: String, default: 'normal' },
  timestamp: { type: String, default: '' },
  hideTimestamp: { type: Boolean },
  timestampPosition: { type: String, default: 'bottom' },
  color: { type: String, default: '' },
  hollow: { type: Boolean }
}

export function createTimelineItem(features: UiFeature[] = []) {
  const base = wrapperConfig({
    name: 'UiTimelineItem',
    baseClass: 'ui-timeline-item',
    props: timelineItemBaseProps,
    defaultTag: 'li'
  })
  return createUiComponent(
    {
      ...base,
      classes: (props, state) => [
        ...(base.classes?.(props, state) ?? []),
        props.hollow ? 'is-hollow' : '',
        props.timestampPosition === 'top' ? 'is-timestamp-top' : 'is-timestamp-bottom'
      ],
      styles: (props) => (props.color ? ({ '--ui-timeline-dot-color': props.color } as Record<string, string>) : {}),
      content: ({ props, slots }) => {
        const timestamp =
          !props.hideTimestamp && props.timestamp
            ? h('div', { class: 'ui-timeline-item__timestamp' }, props.timestamp)
            : null
        const body = h('div', { class: 'ui-timeline-item__content' }, [slots.default?.() ?? null])
        return props.timestampPosition === 'top' ? [timestamp, body] : [body, timestamp]
      }
    },
    features
  )
}
