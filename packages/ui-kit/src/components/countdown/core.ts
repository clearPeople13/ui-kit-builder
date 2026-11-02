import { h, onBeforeUnmount, ref, watch } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import './core.css'

const countdownBaseProps = {
  value: { type: [Number, Object], default: 0 },
  format: { type: String, default: 'HH:mm:ss' },
  prefix: { type: String },
  suffix: { type: String },
  title: { type: String },
  valueStyle: { type: [String, Object, Array, Boolean] }
}

function targetTime(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime()
  }
  if (typeof value === 'object' && value) {
    const record = value as Record<string, any>
    const days = Number(record.days ?? 0)
    const hours = Number(record.hours ?? 0)
    const minutes = Number(record.minutes ?? 0)
    const seconds = Number(record.seconds ?? 0)
    return Date.now() + ((days * 24 + hours) * 60 + minutes) * 60 * 1000 + seconds * 1000
  }
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) {
    return Date.now()
  }
  return numeric > 1e11 ? numeric : Date.now() + numeric * 1000
}

function pad(value: number): string {
  return String(Math.max(0, value)).padStart(2, '0')
}

function formatTime(remaining: number, format: string): string {
  const total = Math.max(0, Math.floor(remaining / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return String(format || 'HH:mm:ss')
    .replace(/D+/g, String(days))
    .replace(/HH/g, pad(hours))
    .replace(/H/g, String(hours))
    .replace(/mm/g, pad(minutes))
    .replace(/m/g, String(minutes))
    .replace(/ss/g, pad(seconds))
    .replace(/s/g, String(seconds))
}

export function createCountdown(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiCountdown',
      baseClass: 'ui-countdown',
      props: countdownBaseProps,
      setup(props) {
        const target = ref(targetTime(props.value))
        const remaining = ref(Math.max(0, target.value - Date.now()))
        let timer: ReturnType<typeof setInterval> | null = null

        function tick() {
          remaining.value = Math.max(0, target.value - Date.now())
          if (remaining.value <= 0 && timer) {
            clearInterval(timer)
            timer = null
          }
        }

        function start() {
          if (timer) {
            clearInterval(timer)
          }
          tick()
          timer = setInterval(tick, 1000)
        }

        watch(
          () => props.value,
          () => {
            target.value = targetTime(props.value)
            start()
          }
        )

        start()
        onBeforeUnmount(() => {
          if (timer) {
            clearInterval(timer)
          }
        })

        return {
          get text() {
            return formatTime(remaining.value, String(props.format || 'HH:mm:ss'))
          },
          get finished() {
            return remaining.value <= 0
          }
        }
      },
      classes: (_props, state) => [state.finished ? 'is-finished' : ''],
      content: ({ props, state }) => [
        props.title ? h('div', { class: 'ui-countdown__title' }, props.title) : null,
        h('div', { class: 'ui-countdown__value', style: props.valueStyle as any }, [
          props.prefix ? h('span', { class: 'ui-countdown__prefix' }, props.prefix) : null,
          h('span', { class: 'ui-countdown__time' }, state.text),
          props.suffix ? h('span', { class: 'ui-countdown__suffix' }, props.suffix) : null
        ])
      ]
    },
    features
  )
}
