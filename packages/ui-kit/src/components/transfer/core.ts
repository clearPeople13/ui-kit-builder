import { h, ref } from 'vue'
import { ArrowLeft, ArrowRight } from '../../shared/icons'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { useLocale } from '../../shared/config'
import { renderIcon } from '../../shared/icon'
import { createCheckbox } from '../checkbox/core'
import './core.css'

const TransferCheckbox = createCheckbox([])

interface TransferItem {
  key: string | number
  label: string
  disabled: boolean
}

const transferBaseProps = {
  data: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
  titles: { type: Array, default: () => [] },
  buttonTexts: { type: Array, default: () => [] },
  filterPlaceholder: { type: String },
  leftDefaultChecked: { type: Array, default: () => [] },
  rightDefaultChecked: { type: Array, default: () => [] },
  props: { type: Object, default: () => ({}) }
}

function normalizeItems(data: unknown, fields: Record<string, any>): TransferItem[] {
  if (!Array.isArray(data)) {
    return []
  }
  const keyField = fields.key ?? 'key'
  const labelField = fields.label ?? 'label'
  const disabledField = fields.disabled ?? 'disabled'
  return data.map((item, index) => {
    const record =
      item && typeof item === 'object' ? (item as Record<string, any>) : { [keyField]: index, [labelField]: item }
    return {
      key: record[keyField] ?? index,
      label: String(record[labelField] ?? record[keyField] ?? ''),
      disabled: Boolean(record[disabledField])
    }
  })
}

export function createTransfer(features: UiFeature[] = []) {
  return createUiComponent(
    {
      name: 'UiTransfer',
      baseClass: 'ui-transfer',
      props: transferBaseProps,
      setup(props, { emit }) {
        const locale = useLocale('transfer')
        const items = () => normalizeItems(props.data, props.props ?? {})
        // 预设勾次要过滤 disabled 条目，否则右移按钮会被点亮并把禁用项搬走
        const pickEnabled = (keys: unknown) => {
          const disabledKeys = new Set(
            items()
              .filter((item) => item.disabled)
              .map((item) => item.key)
          )
          return new Set((Array.isArray(keys) ? keys : []).filter((key) => !disabledKeys.has(key)))
        }
        const leftChecked = ref<Set<string | number>>(pickEnabled(props.leftDefaultChecked))
        const rightChecked = ref<Set<string | number>>(pickEnabled(props.rightDefaultChecked))
        const leftQuery = ref('')
        const rightQuery = ref('')

        const targetKeys = () => (Array.isArray(props.modelValue) ? props.modelValue : [])
        const leftItems = () =>
          items().filter((item) => !targetKeys().includes(item.key) && item.label.includes(leftQuery.value))
        const rightItems = () =>
          items().filter((item) => targetKeys().includes(item.key) && item.label.includes(rightQuery.value))

        function toggle(side: 'left' | 'right', key: string | number, checked: boolean) {
          const target = side === 'left' ? leftChecked : rightChecked
          const next = new Set(target.value)
          if (checked) {
            next.add(key)
          } else {
            next.delete(key)
          }
          target.value = next
        }

        function emitKeys(next: Array<string | number>, direction: 'left' | 'right') {
          emit('update:modelValue', next)
          emit('change', next, direction)
        }

        function moveToRight() {
          const next = [...targetKeys()]
          for (const key of leftChecked.value) {
            if (!next.includes(key)) {
              next.push(key)
            }
          }
          leftChecked.value = new Set()
          emitKeys(next, 'right')
        }

        function moveToLeft() {
          const next = targetKeys().filter((key) => !rightChecked.value.has(key))
          rightChecked.value = new Set()
          emitKeys(next, 'left')
        }

        return {
          locale,
          leftChecked,
          rightChecked,
          leftQuery,
          rightQuery,
          leftItems,
          rightItems,
          toggle,
          moveToRight,
          moveToLeft
        }
      },
      content: ({ props, state }) => {
        const titles = Array.isArray(props.titles) ? props.titles : []
        const buttons = Array.isArray(props.buttonTexts) ? props.buttonTexts : []
        const panel = (
          side: 'left' | 'right',
          title: string,
          list: TransferItem[],
          checked: Set<string | number>,
          query: { value: string }
        ) =>
          h('div', { class: `ui-transfer__panel is-${side}` }, [
            h('div', { class: 'ui-transfer__header' }, [
              h('span', null, title),
              h('span', { class: 'ui-transfer__count' }, `${checked.size}/${list.length}`)
            ]),
            props.filterable
              ? h('div', { class: 'ui-transfer__filter' }, [
                  h('input', {
                    class: 'ui-transfer__input',
                    value: query.value,
                    placeholder: props.filterPlaceholder || state.locale.value.filterPlaceholder,
                    onInput: (event: Event) => {
                      query.value = (event.target as HTMLInputElement).value
                    }
                  })
                ])
              : null,
            h(
              'div',
              { class: 'ui-transfer__list' },
              list.length
                ? list.map((item) =>
                    h('div', { class: ['ui-transfer__item', item.disabled ? 'is-disabled' : ''], key: item.key }, [
                      h(
                        TransferCheckbox,
                        {
                          class: 'ui-transfer__checkbox',
                          modelValue: checked.has(item.key),
                          disabled: item.disabled,
                          'onUpdate:modelValue': (value: boolean) => state.toggle(side, item.key, value)
                        },
                        { default: () => item.label }
                      )
                    ])
                  )
                : h('div', { class: 'ui-transfer__empty' }, state.locale.value.empty)
            )
          ])
        return [
          panel('left', String(titles[0] ?? '列表 1'), state.leftItems(), state.leftChecked.value, state.leftQuery),
          h('div', { class: 'ui-transfer__actions' }, [
            h(
              'button',
              {
                class: ['ui-transfer__button', buttons[0] ? 'is-text' : ''],
                type: 'button',
                disabled: !state.leftChecked.value.size,
                onClick: () => state.moveToRight()
              },
              [buttons[0] ?? renderIcon(ArrowRight)]
            ),
            h(
              'button',
              {
                class: ['ui-transfer__button', buttons[1] ? 'is-text' : ''],
                type: 'button',
                disabled: !state.rightChecked.value.size,
                onClick: () => state.moveToLeft()
              },
              [buttons[1] ?? renderIcon(ArrowLeft)]
            )
          ]),
          panel('right', String(titles[1] ?? '列表 2'), state.rightItems(), state.rightChecked.value, state.rightQuery)
        ]
      }
    },
    features
  )
}
