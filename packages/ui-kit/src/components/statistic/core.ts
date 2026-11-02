import { h } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { statisticFormatFeature } from './features/format/index'
import './core.css'

const statisticBaseProps = {
  value: { type: [Number, Object], default: 0 },
  decimalSeparator: { type: String, default: '.' },
  groupSeparator: { type: String, default: ',' },
  precision: { type: Number, default: 0 },
  prefix: { type: String },
  suffix: { type: String },
  title: { type: String },
  valueStyle: { type: [String, Object, Array, Boolean] }
}

function formatNumber(value: unknown, precision: number, decimalSeparator: string, groupSeparator: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return String(value ?? '')
  }
  const fixed = numeric.toFixed(Math.max(0, Number(precision) || 0))
  const [integer, decimal] = fixed.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator || ',')
  return decimal ? `${grouped}${decimalSeparator || '.'}${decimal}` : grouped
}

export function createStatistic(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiStatistic',
      baseClass: 'ui-statistic',
      props: statisticBaseProps,
      tag: (props) => (props.tag as string) || 'div',
      content: ({ props, slots }) => [
        props.title ? h('div', { class: 'ui-statistic__title' }, props.title) : null,
        h('div', { class: 'ui-statistic__content', style: props.valueStyle as any }, [
          props.prefix ? h('span', { class: 'ui-statistic__prefix' }, props.prefix) : null,
          h(
            'span',
            { class: 'ui-statistic__value' },
            typeof props.formatter === 'function'
              ? String(props.formatter(props.value))
              : formatNumber(
                  props.value,
                  Number(props.precision ?? 0),
                  String(props.decimalSeparator ?? '.'),
                  String(props.groupSeparator ?? ',')
                )
          ),
          props.suffix ? h('span', { class: 'ui-statistic__suffix' }, props.suffix) : null
        ]),
        slots.default ? h('div', { class: 'ui-statistic__footer' }, [slots.default()]) : null
      ]
    },
    features
  )
}
