import type { Component, CSSProperties, VNode, VNodeChild } from 'vue'
import { Teleport, computed, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader, Plus, Star, Upload as UploadIcon, X } from './icons'
import type { UiComponentConfig, UiComponentContext } from './component'
import { collectFeatureHooks } from './feature'
import { getFocusableElements } from './focus'
import { renderIcon } from './icon'
import { useFloatingPanel } from './panel'
import { useScrollLock } from './scroll-lock'
import { normalizeOptions } from './options'
import { addUnit, clamp, isFunction, isNil, isObject, isString } from './utils'
import { nextZIndex, resolveZIndex } from './z-index'

type AnyProps = Record<string, any>

const dimensionKeys = [
  'width',
  'height',
  'maxWidth',
  'maxHeight',
  'minWidth',
  'minHeight',
  'top',
  'left',
  'right',
  'bottom'
] as const

export function sizeValue(value: unknown): string | undefined {
  return addUnit(value)
}

export function dimensionStyles(props: AnyProps): CSSProperties {
  const style: CSSProperties = {}
  for (const key of dimensionKeys) {
    const value = sizeValue(props[key])
    if (value) {
      ;(style as Record<string, any>)[key] = value
    }
  }
  if (props.zIndex !== undefined) {
    style.zIndex = Number(props.zIndex)
  }
  if (props.color) {
    style.color = props.color
  }
  if (props.backgroundColor) {
    style.backgroundColor = props.backgroundColor
  }
  if (props.fontSize) {
    style.fontSize = sizeValue(props.fontSize)
  }
  return style
}

export function baseAttrs(props: AnyProps): Record<string, any> {
  const attrs: Record<string, any> = {}
  if (props.id) {
    attrs.id = props.id
  }
  if (props.role) {
    attrs.role = props.role
  }
  if (props.tabindex !== undefined) {
    attrs.tabindex = props.tabindex
  }
  if (props.ariaLabel) {
    attrs['aria-label'] = props.ariaLabel
  }
  return attrs
}

function stateClasses(baseClass: string, props: AnyProps): string[] {
  const classes: string[] = []
  for (const key of ['type', 'effect', 'status', 'placement', 'position', 'shape', 'mode']) {
    const value = props[key]
    if (isString(value) && value) {
      classes.push(`${baseClass}--${value}`)
    }
  }
  if (isString(props.size) && props.size) {
    classes.push(`${baseClass}--size-${props.size}`)
  }
  if (props.disabled) {
    classes.push('is-disabled')
  }
  return classes
}

export function wrapperConfig(options: {
  name: string
  baseClass: string
  props: AnyProps
  defaultTag?: string
  fallbackKeys?: string[]
}): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    tag: (props) => (props.tag as string) || options.defaultTag || 'div',
    classes: (props) => stateClasses(options.baseClass, props),
    styles: (props) => dimensionStyles(props),
    attrs: (props) => {
      const attrs = baseAttrs(props)
      if (props.href) {
        attrs.href = props.href
        attrs.target = props.target
      }
      if (props.src) {
        attrs.src = props.src
      }
      return attrs
    },
    content: ({ props, slots }) => {
      const keys = options.fallbackKeys ?? ['label', 'title', 'description', 'content', 'value']
      for (const key of keys) {
        if (props[key] !== undefined && props[key] !== '') {
          return props[key]
        }
      }
      return slots.default?.() ?? null
    }
  }
}

export function textConfig(options: {
  name: string
  baseClass: string
  props: AnyProps
  defaultTag?: string
}): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    tag: (props) => (props.tag as string) || options.defaultTag || 'span',
    classes: (props) => stateClasses(options.baseClass, props),
    attrs: (props) => {
      const attrs = baseAttrs(props)
      if (props.href) {
        attrs.href = props.href
        attrs.target = props.target
      }
      return attrs
    },
    content: ({ props, slots }) => slots.default?.() ?? props.value ?? props.label ?? props.content ?? null
  }
}

function modelEvents(emit: (event: string, ...args: any[]) => void) {
  return {
    onInput: (event: Event) => {
      const value = (event.target as HTMLInputElement).value
      emit('update:modelValue', value)
      emit('input', value)
    },
    onChange: (event: Event) => {
      const value = (event.target as HTMLInputElement).value
      emit('change', value)
    },
    onFocus: (event: Event) => emit('focus', event),
    onBlur: (event: Event) => emit('blur', event)
  }
}

export function inputConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    classes: (props) => {
      const classes = stateClasses(options.baseClass, props)
      if (props.type === 'textarea') {
        classes.push(`${options.baseClass}--textarea`)
      }
      return classes
    },
    styles: (props) => (props.inputStyle as CSSProperties) ?? {},
    content: ({ props, emit, slots }) => {
      const type = props.type === 'textarea' ? 'textarea' : props.type || 'text'
      const shared: Record<string, any> = {
        class: `${options.baseClass}__inner`,
        id: props.id,
        value: props.modelValue ?? '',
        disabled: Boolean(props.disabled),
        readonly: Boolean(props.readonly),
        placeholder: props.placeholder,
        autocomplete: props.autocomplete,
        name: props.name,
        maxlength: props.maxlength,
        minlength: props.minlength,
        autofocus: Boolean(props.autofocus),
        tabindex: props.tabindex,
        ...modelEvents(emit)
      }
      if (props.type === 'textarea') {
        shared.rows = props.rows ?? 2
        if (typeof props.resize === 'string' && props.resize) {
          shared.style = { resize: props.resize }
        }
        return [h('textarea', shared), slots.append?.()]
      }
      shared.type = type
      return [h('input', shared), slots.append?.()]
    }
  }
}

export function inputNumberConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    classes: (props) => [
      ...stateClasses(options.baseClass, props),
      props.controls === false ? 'is-controls-none' : '',
      props.controlsPosition === 'both' ? 'is-controls-both' : ''
    ],
    content: ({ props, emit }) => {
      const min = Number(props.min ?? -Infinity)
      const max = Number(props.max ?? Infinity)
      const step = Number(props.step ?? 1) || 1
      const disabled = Boolean(props.disabled) || Boolean(props.readonly)
      const value =
        props.modelValue === undefined || props.modelValue === null || Number.isNaN(Number(props.modelValue))
          ? undefined
          : Number(props.modelValue)
      const precision = props.precision === undefined ? undefined : Number(props.precision)
      const roundTo = (next: number) => (precision === undefined ? next : Number(next.toFixed(precision)))
      const displayValue = value === undefined ? undefined : roundTo(value)
      const commit = (next: number) => {
        emit('update:modelValue', next)
        emit('input', next)
        emit('change', next)
      }
      const stepBy = (direction: number) => {
        commit(roundTo(clamp((value ?? 0) + direction * step, min, max)))
      }
      const input = h('input', {
        class: `${options.baseClass}__inner`,
        type: 'number',
        value: displayValue ?? '',
        min: props.min,
        max: props.max,
        step: props.step,
        disabled: Boolean(props.disabled),
        readonly: Boolean(props.readonly),
        placeholder: props.placeholder,
        id: props.id,
        name: props.name,
        tabindex: props.tabindex,
        'aria-label': props.ariaLabel,
        style: props.align ? { textAlign: props.align } : undefined,
        onInput: (event: Event) => {
          const raw = (event.target as HTMLInputElement).value
          const next = raw === '' ? undefined : Number(raw)
          emit('update:modelValue', next)
          emit('input', next)
          emit('change', next)
        }
      })
      if (props.controls === false) {
        return input
      }
      const increase = h(
        'button',
        {
          class: `${options.baseClass}__increase`,
          type: 'button',
          disabled: disabled || (value !== undefined && value >= max),
          'aria-label': 'Increase value',
          onClick: () => stepBy(1)
        },
        [renderIcon(ChevronUp)]
      )
      const decrease = h(
        'button',
        {
          class: `${options.baseClass}__decrease`,
          type: 'button',
          disabled: disabled || (value !== undefined && value <= min),
          'aria-label': 'Decrease value',
          onClick: () => stepBy(-1)
        },
        [renderIcon(ChevronDown)]
      )
      if (props.controlsPosition === 'both') {
        return [decrease, input, increase]
      }
      return [input, h('div', { class: `${options.baseClass}__controls` }, [increase, decrease])]
    }
  }
}

export function selectConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    classes: (props) => stateClasses(options.baseClass, props),
    attrs: (props) => baseAttrs(props),
    content: ({ props, emit, slots }) => {
      const multiple = Boolean(props.multiple)
      const list = normalizeOptions(props.options)
      const onChange = (event: Event) => {
        const target = event.target as HTMLSelectElement
        const value = multiple ? Array.from(target.selectedOptions).map((option) => option.value) : target.value
        emit('update:modelValue', value)
        emit('change', value)
      }
      return h(
        'select',
        {
          class: `${options.baseClass}__inner`,
          value: props.modelValue,
          multiple,
          disabled: Boolean(props.disabled),
          name: props.name,
          onChange,
          onFocus: (event: Event) => emit('focus', event),
          onBlur: (event: Event) => emit('blur', event)
        },
        [
          props.placeholder && !multiple
            ? h('option', { value: '', disabled: Boolean(props.required) }, props.placeholder)
            : null,
          ...list.map((option) =>
            h(
              'option',
              {
                value: option.value,
                disabled: option.disabled
              },
              option.label
            )
          ),
          slots.default?.()
        ]
      )
    }
  }
}

export function optionConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    tag: () => 'option',
    attrs: (props) => ({ value: props.value, disabled: Boolean(props.disabled) }),
    content: ({ props, slots }) => slots.default?.() ?? props.label ?? props.value ?? null
  }
}

function resolveCheckedValue(props: AnyProps): boolean {
  const value = props.value ?? props.label
  const trueValue = props.trueValue ?? props.trueLabel
  const falseValue = props.falseValue ?? props.falseLabel
  const model = props.modelValue !== undefined ? props.modelValue : props.checked
  if (trueValue !== undefined) {
    return model === trueValue
  }
  if (falseValue !== undefined) {
    return model === falseValue ? false : Boolean(model)
  }
  if (Array.isArray(model)) {
    return model.includes(value)
  }
  // 显式布尔值按开关语义处理：true 即选中；false 不足以判定未选中，
  // 因为 Checkbox 也支持只写 checked 的初始态写法，回退到 checked 保住该语义。
  if (typeof model === 'boolean') {
    if (model) {
      return true
    }
    return props.checked === true
  }
  return model === value
}

function labelText(props: AnyProps): string | number {
  const label = props.label
  return typeof label === 'string' || typeof label === 'number' ? label : ''
}

interface ChoiceControlOptions {
  baseClass: string
  type: 'checkbox' | 'radio'
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  value?: any
  name?: string
  id?: string
  tabindex?: string | number
  ariaLabel?: string
  ariaControls?: string
  onChange: (checked: boolean) => void
}

function renderChoiceControl(options: ChoiceControlOptions) {
  return h('input', {
    class: `${options.baseClass}__inner`,
    type: options.type,
    id: options.id,
    name: options.name,
    tabindex: options.tabindex,
    'aria-label': options.ariaLabel,
    'aria-controls': options.ariaControls,
    value: options.value,
    checked: options.checked,
    indeterminate: options.indeterminate,
    disabled: options.disabled,
    onChange: (event: Event) => {
      options.onChange((event.target as HTMLInputElement).checked)
    }
  })
}

function renderChoice(baseClass: string, control: VNodeChild, label: VNodeChild) {
  const children = isNil(label) ? [] : [label]
  return [control, h('span', { class: `${baseClass}__label` }, children)]
}

interface CheckboxGroupContext {
  modelValue: { value: any[] }
  disabled: { value: boolean }
  size: { value: string | undefined }
  toggle: (value: any, checked: boolean) => void
}

const CHECKBOX_GROUP_KEY = Symbol('ui-checkbox-group')

function checkboxChoiceState(
  props: AnyProps,
  emit: UiComponentContext['emit'],
  inject: (key: string | symbol, defaultValue?: any) => any
) {
  const group = inject(CHECKBOX_GROUP_KEY, null) as CheckboxGroupContext | null
  const ownValue = () => props.value ?? props.label
  function isChecked(): boolean {
    return group ? group.modelValue.value.includes(ownValue()) : resolveCheckedValue(props)
  }
  function isDisabled(): boolean {
    return Boolean(props.disabled) || Boolean(group?.disabled.value)
  }
  function sizeValue(): string | undefined {
    return props.size ?? group?.size.value
  }
  function toggle(checked: boolean): void {
    if (group) {
      group.toggle(ownValue(), checked)
      return
    }
    const trueValue = props.trueValue ?? props.trueLabel
    const falseValue = props.falseValue ?? props.falseLabel
    const next = checked ? (trueValue ?? true) : (falseValue ?? false)
    emit('update:modelValue', next)
    emit('update:checked', checked)
    emit('change', next)
  }
  return { isChecked, isDisabled, sizeValue, toggle }
}

export function checkboxConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    tag: () => 'label',
    setup: (props, { emit, inject }) => checkboxChoiceState(props, emit, inject),
    classes: (props, state) =>
      stateClasses(options.baseClass, {
        ...props,
        size: state.sizeValue(),
        disabled: state.isDisabled()
      }),
    content: ({ props, slots, state }) =>
      renderChoice(
        options.baseClass,
        renderChoiceControl({
          baseClass: options.baseClass,
          type: 'checkbox',
          id: props.id,
          name: props.name,
          tabindex: props.tabindex,
          ariaLabel: props.ariaLabel,
          ariaControls: props.ariaControls,
          checked: state.isChecked(),
          indeterminate: Boolean(props.indeterminate),
          disabled: state.isDisabled(),
          value: props.value ?? props.label,
          onChange: (checked) => state.toggle(checked)
        }),
        slots.default?.() ?? labelText(props)
      )
  }
}

function nextCheckboxValue(
  selected: any[],
  value: any,
  checked: boolean,
  min: number | undefined,
  max: number | undefined
): any[] | null {
  if (checked) {
    if (max !== undefined && selected.length >= max) {
      return null
    }
    return [...selected, value]
  }
  if (min !== undefined && selected.length <= min) {
    return null
  }
  return selected.filter((item) => item !== value)
}

export function checkboxGroupConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    tag: (props) => (props.tag as string) || 'div',
    classes: (props) => stateClasses(options.baseClass, props),
    styles: (props) => dimensionStyles(props),
    attrs: (props) => ({ ...baseAttrs(props), role: 'group' }),
    setup: (props, { emit, provide }) => {
      const selected = computed<any[]>(() => (Array.isArray(props.modelValue) ? props.modelValue : []))
      function toggle(value: any, checked: boolean): void {
        const min = Number.isFinite(Number(props.min)) ? Number(props.min) : undefined
        const max = Number.isFinite(Number(props.max)) ? Number(props.max) : undefined
        const next = nextCheckboxValue(selected.value, value, checked, min, max)
        if (!next) {
          return
        }
        emit('update:modelValue', next)
        emit('change', next)
      }
      provide(CHECKBOX_GROUP_KEY, {
        modelValue: selected,
        disabled: computed(() => Boolean(props.disabled)),
        size: computed(() => props.size),
        toggle
      })
      return {}
    },
    content: ({ props, slots, emit }) => {
      const list = normalizeOptions(props.options, props.props)
      if (!list.length) {
        return slots.default?.() ?? null
      }
      const itemClass = props.type === 'button' ? 'ui-checkbox-button' : 'ui-checkbox'
      const min = Number.isFinite(Number(props.min)) ? Number(props.min) : undefined
      const max = Number.isFinite(Number(props.max)) ? Number(props.max) : undefined
      const selected: any[] = Array.isArray(props.modelValue) ? props.modelValue : []
      return list.map((option) => {
        const checked = selected.includes(option.value)
        const disabled = Boolean(props.disabled) || Boolean(option.disabled)
        return h(
          'label',
          {
            class: [
              itemClass,
              props.size ? `${itemClass}--size-${props.size}` : '',
              checked ? 'is-checked' : '',
              disabled ? 'is-disabled' : ''
            ]
          },
          renderChoice(
            itemClass,
            renderChoiceControl({
              baseClass: itemClass,
              type: 'checkbox',
              checked,
              disabled,
              value: option.value,
              onChange: (next) => {
                const values = nextCheckboxValue(selected, option.value, next, min, max)
                if (!values) {
                  return
                }
                emit('update:modelValue', values)
                emit('change', values)
              }
            }),
            option.label
          )
        )
      })
    }
  }
}

interface RadioGroupContext {
  modelValue: { value: any }
  disabled: { value: boolean }
  name: { value: string | undefined }
  select: (value: any) => void
}

const RADIO_GROUP_KEY = Symbol('ui-radio-group')

function radioChoiceState(
  props: AnyProps,
  emit: UiComponentContext['emit'],
  inject: (key: string | symbol, defaultValue?: any) => any
) {
  const group = inject(RADIO_GROUP_KEY, null) as RadioGroupContext | null
  const ownValue = () => props.value ?? props.label
  function isChecked(): boolean {
    return group ? group.modelValue.value === ownValue() : props.modelValue === ownValue()
  }
  function isDisabled(): boolean {
    return Boolean(props.disabled) || Boolean(group?.disabled.value)
  }
  function controlName(): string | undefined {
    return props.name ?? group?.name.value
  }
  function select(): void {
    const value = ownValue()
    if (group) {
      group.select(value)
      return
    }
    emit('update:modelValue', value)
    emit('change', value)
  }
  return { isChecked, isDisabled, controlName, select }
}

function radioClasses(baseClass: string, props: AnyProps, state: Record<string, any>): string[] {
  const classes = stateClasses(baseClass, props).filter((className) => className !== 'is-disabled')
  classes.push(state.isChecked() ? 'is-checked' : '', state.isDisabled() ? 'is-disabled' : '')
  return classes
}

export function radioConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    tag: () => 'label',
    setup: (props, { emit, inject }) => radioChoiceState(props, emit, inject),
    classes: (props, state) => radioClasses(options.baseClass, props, state),
    content: ({ props, slots, state }) =>
      renderChoice(
        options.baseClass,
        renderChoiceControl({
          baseClass: options.baseClass,
          type: 'radio',
          name: state.controlName(),
          checked: state.isChecked(),
          disabled: state.isDisabled(),
          value: props.value ?? props.label,
          onChange: () => state.select()
        }),
        slots.default?.() ?? labelText(props)
      )
  }
}

export function radioButtonConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    tag: () => 'label',
    setup: (props, { emit, inject }) => radioChoiceState(props, emit, inject),
    classes: (props, state) => radioClasses(options.baseClass, props, state),
    content: ({ props, slots, state }) => [
      renderChoiceControl({
        baseClass: options.baseClass,
        type: 'radio',
        name: state.controlName(),
        checked: state.isChecked(),
        disabled: state.isDisabled(),
        value: props.value ?? props.label,
        onChange: () => state.select()
      }),
      h('span', { class: `${options.baseClass}__label` }, slots.default?.() ?? labelText(props))
    ]
  }
}

export function radioGroupConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    classes: (props) => stateClasses(options.baseClass, props),
    styles: (props) => {
      if (props.type !== 'button') {
        return {}
      }
      const style: Record<string, string> = {}
      if (props.fill) {
        style['--ui-radio-fill'] = props.fill
      }
      if (props.textColor) {
        style['--ui-radio-text-color'] = props.textColor
      }
      return style as CSSProperties
    },
    attrs: (props) => ({ ...baseAttrs(props), role: 'radiogroup' }),
    setup: (props, { emit, provide }) => {
      provide(RADIO_GROUP_KEY, {
        modelValue: computed(() => props.modelValue),
        disabled: computed(() => Boolean(props.disabled)),
        name: computed(() => props.name),
        select(value: any) {
          emit('update:modelValue', value)
          emit('change', value)
        }
      })
      return {}
    },
    content: ({ props, slots, emit }) => {
      const list = normalizeOptions(props.options, props.props)
      if (!list.length) {
        return slots.default?.() ?? null
      }
      const itemClass = props.type === 'button' ? 'ui-radio-button' : 'ui-radio'
      return list.map((option) => {
        const checked = props.modelValue === option.value
        const disabled = Boolean(props.disabled) || Boolean(option.disabled)
        return h('label', { class: [itemClass, checked ? 'is-checked' : '', disabled ? 'is-disabled' : ''] }, [
          renderChoiceControl({
            baseClass: itemClass,
            type: 'radio',
            name: props.name,
            checked,
            disabled,
            value: option.value,
            onChange: () => {
              emit('update:modelValue', option.value)
              emit('change', option.value)
            }
          }),
          h('span', { class: `${itemClass}__label` }, option.label)
        ])
      })
    }
  }
}

export function switchConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  const baseClass = options.baseClass
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    classes: (props) => [
      ...stateClasses(options.baseClass, props),
      props.modelValue === (props.activeValue ?? true) ? 'is-checked' : '',
      props.loading ? 'is-loading' : ''
    ],
    tag: () => 'label',
    content: ({ props, emit, slots }) => {
      const checked = props.modelValue === (props.activeValue ?? true)
      const loading = Boolean(props.loading)
      const activeText = isNil(props.activeText) ? '' : String(props.activeText)
      const inactiveText = isNil(props.inactiveText) ? '' : String(props.inactiveText)
      const inlineText = props.inlinePrompt
        ? h(
            'span',
            { class: [`${baseClass}__inline-text`, checked ? 'is-active' : ''] },
            checked ? activeText : inactiveText
          )
        : null
      const trackIcon = loading
        ? h('span', { class: `${baseClass}__loading` }, [renderIcon(Loader, { class: 'is-spinning', size: 12 })])
        : checked
          ? props.activeIcon
            ? h('span', { class: [`${baseClass}__icon`, 'is-active'] }, [renderIcon(props.activeIcon, { size: 12 })])
            : null
          : props.inactiveIcon
            ? h('span', { class: [`${baseClass}__icon`, 'is-inactive'] }, [
                renderIcon(props.inactiveIcon, { size: 12 })
              ])
            : null
      const actionIcon =
        loading || props.inlinePrompt
          ? null
          : checked
            ? props.activeActionIcon
              ? h('span', { class: `${baseClass}__action` }, [renderIcon(props.activeActionIcon, { size: 10 })])
              : null
            : props.inactiveActionIcon
              ? h('span', { class: `${baseClass}__action` }, [renderIcon(props.inactiveActionIcon, { size: 10 })])
              : null
      const trackStyle: Record<string, string> = {}
      if (props.width) {
        trackStyle['--ui-switch-width'] = typeof props.width === 'number' ? `${props.width}px` : String(props.width)
      }
      return [
        !props.inlinePrompt && inactiveText
          ? h('span', { class: [`${baseClass}__label`, 'is-left'] }, inactiveText)
          : null,
        h('span', { class: `${baseClass}__track`, style: trackStyle }, [
          h('input', {
            class: `${baseClass}__inner`,
            type: 'checkbox',
            role: 'switch',
            id: props.id,
            name: props.name,
            tabindex: props.tabindex,
            'aria-label': props.ariaLabel,
            checked,
            disabled: Boolean(props.disabled) || loading,
            onChange: (event: Event) => {
              if (loading) {
                ;(event.target as HTMLInputElement).checked = checked
                return
              }
              const next = (event.target as HTMLInputElement).checked
              emit('update:modelValue', next ? (props.activeValue ?? true) : (props.inactiveValue ?? false))
              emit('change', next ? (props.activeValue ?? true) : (props.inactiveValue ?? false))
            }
          }),
          inlineText ?? trackIcon,
          actionIcon
        ]),
        !props.inlinePrompt && activeText
          ? h('span', { class: [`${baseClass}__label`, 'is-right'] }, activeText)
          : null,
        h('span', { class: `${baseClass}__label` }, [slots.default?.() ?? null])
      ]
    }
  }
}

export function sliderConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    classes: (props) => [...stateClasses(options.baseClass, props), props.vertical ? 'is-vertical' : ''],
    setup() {
      const active = ref(false)
      return {
        activate() {
          active.value = true
        },
        deactivate() {
          active.value = false
        },
        get active() {
          return active.value
        }
      }
    },
    content: ({ props, emit, state }) => {
      const baseClass = options.baseClass
      const vertical = Boolean(props.vertical)
      const min = Number(props.min ?? 0)
      const max = Number(props.max ?? 100)
      const stepValue = Number(props.step ?? 1) || 1
      const fallback = Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue
      const current = Number(fallback ?? min)
      const value = Number.isFinite(current) ? clamp(current, min, max) : min
      const percent = max === min ? 0 : ((value - min) / (max - min)) * 100
      const label = typeof props.formatTooltip === 'function' ? props.formatTooltip(value) : value
      const tooltip =
        props.showTooltip !== false
          ? h(
              'div',
              {
                class: [
                  `${baseClass}__tooltip`,
                  `is-${props.placement ?? (vertical ? 'right' : 'top')}`,
                  props.persistent === true || state.active ? '' : 'is-hidden',
                  props.tooltipClass
                ]
              },
              [label]
            )
          : null
      const isRange = Boolean(props.range)
      const rawRange = Array.isArray(props.modelValue) ? props.modelValue : []
      const percentOf = (point: number) => (max === min ? 0 : ((point - min) / (max - min)) * 100)
      const rangeFirst = clamp(Number(rawRange[0] ?? min), min, max)
      const rangeSecond = clamp(Number(rawRange[1] ?? max), min, max)
      const rangeLow = Math.min(rangeFirst, rangeSecond)
      const rangeHigh = Math.max(rangeFirst, rangeSecond)
      const lowPercent = percentOf(rangeLow)
      const highPercent = percentOf(rangeHigh)
      const rangeTooltip = (point: number, side: string) =>
        props.showTooltip !== false
          ? h(
              'div',
              {
                class: [
                  `${baseClass}__tooltip`,
                  `is-${props.placement ?? (vertical ? 'right' : 'top')}`,
                  props.persistent === true || state.active ? '' : 'is-hidden',
                  props.tooltipClass,
                  `is-${side}`
                ]
              },
              [typeof props.formatTooltip === 'function' ? props.formatTooltip(point) : point]
            )
          : null

      function commit(next: number, source: 'drag' | 'input') {
        const clamped = clamp(next, min, max)
        emit('update:modelValue', clamped)
        emit(source === 'drag' ? 'input' : 'change', clamped)
      }

      function commitRange(nextLow: number, nextHigh: number, source: 'drag' | 'input') {
        const low = clamp(Math.min(nextLow, nextHigh), min, max)
        const high = clamp(Math.max(nextLow, nextHigh), min, max)
        const next = [low, high]
        emit('update:modelValue', next)
        emit(source === 'drag' ? 'input' : 'change', next)
      }

      function stepTo(direction: 1 | -1) {
        if (props.disabled) {
          return
        }
        commit(Number((value + direction * stepValue).toFixed(6)), 'input')
      }

      const stopCount = props.showStops && max > min ? Math.floor((max - min) / stepValue) - 1 : 0
      const stops =
        stopCount > 0
          ? Array.from({ length: Math.min(stopCount, 100) }, (_, index) => {
              const point = ((index + 1) * stepValue * 100) / (max - min)
              return h('span', {
                key: `stop-${index}`,
                class: `${baseClass}__stop`,
                style: vertical ? { bottom: `${point}%` } : { left: `${point}%` }
              })
            })
          : []

      const markEntries =
        isObject(props.marks) && !Array.isArray(props.marks)
          ? Object.entries(props.marks as Record<string, unknown>)
              .map(([key, text]) => ({ point: Number(key), text }))
              .filter((item) => Number.isFinite(item.point) && item.point >= min && item.point <= max)
              .sort((left, right) => left.point - right.point)
          : []
      const markPercent = (point: number) => (max === min ? 0 : ((point - min) / (max - min)) * 100)
      const marks = markEntries.length
        ? h(
            'div',
            { class: `${baseClass}__marks` },
            markEntries.map((item) =>
              h(
                'span',
                {
                  key: item.point,
                  class: `${baseClass}__mark`,
                  style: vertical ? { bottom: `${markPercent(item.point)}%` } : { left: `${markPercent(item.point)}%` }
                },
                isNil(item.text) || item.text === '' ? String(item.point) : String(item.text)
              )
            )
          )
        : null

      if (isRange) {
        const rangeInner = h(
          'div',
          {
            class: [`${baseClass}__inner`, 'is-range', markEntries.length ? 'has-marks' : ''],
            style: vertical
              ? { height: typeof props.height === 'number' ? `${props.height}px` : props.height || '200px' }
              : undefined,
            onMouseenter: () => state.activate(),
            onMouseleave: () => state.deactivate(),
            onFocusin: () => state.activate(),
            onFocusout: () => state.deactivate()
          },
          [
            h('div', { class: `${baseClass}__runway` }, [
              h('div', {
                class: `${baseClass}__bar`,
                style: vertical
                  ? { bottom: `${lowPercent}%`, height: `${highPercent - lowPercent}%` }
                  : { left: `${lowPercent}%`, width: `${highPercent - lowPercent}%` }
              }),
              ...stops
            ]),
            h(
              'div',
              {
                class: [`${baseClass}__button-wrapper`, 'is-low'],
                style: vertical ? { left: '50%', bottom: `${lowPercent}%` } : { left: `${lowPercent}%` }
              },
              [rangeTooltip(rangeLow, 'low'), h('div', { class: `${baseClass}__button` })]
            ),
            h(
              'div',
              {
                class: [`${baseClass}__button-wrapper`, 'is-high'],
                style: vertical ? { left: '50%', bottom: `${highPercent}%` } : { left: `${highPercent}%` }
              },
              [rangeTooltip(rangeHigh, 'high'), h('div', { class: `${baseClass}__button` })]
            ),
            h('input', {
              class: [`${baseClass}__input`, 'is-low'],
              type: 'range',
              id: props.id,
              min,
              max,
              step: props.step ?? 1,
              value: rangeLow,
              disabled: Boolean(props.disabled),
              'aria-label': props.ariaLabel,
              style: vertical
                ? { width: typeof props.height === 'number' ? `${props.height}px` : props.height || '200px' }
                : undefined,
              onInput: (event: Event) =>
                commitRange(Number((event.target as HTMLInputElement).value), rangeHigh, 'drag'),
              // change 必须带本次原生输入值：props 还没回写时 rangeLow 是上一拍的值
              onChange: (event: Event) => {
                const next = Number((event.target as HTMLInputElement).value)
                emit('change', [clamp(Math.min(next, rangeHigh), min, max), clamp(Math.max(next, rangeHigh), min, max)])
              }
            }),
            h('input', {
              class: [`${baseClass}__input`, 'is-high'],
              type: 'range',
              min,
              max,
              step: props.step ?? 1,
              value: rangeHigh,
              disabled: Boolean(props.disabled),
              'aria-label': props.ariaLabel,
              style: vertical
                ? { width: typeof props.height === 'number' ? `${props.height}px` : props.height || '200px' }
                : undefined,
              onInput: (event: Event) =>
                commitRange(rangeLow, Number((event.target as HTMLInputElement).value), 'drag'),
              onChange: (event: Event) => {
                const next = Number((event.target as HTMLInputElement).value)
                emit('change', [clamp(Math.min(next, rangeLow), min, max), clamp(Math.max(next, rangeLow), min, max)])
              }
            }),
            marks
          ]
        )
        if (!props.showInput) {
          return rangeInner
        }
        const lowInput = h('input', {
          class: `${baseClass}__number`,
          type: 'number',
          min,
          max,
          step: props.step ?? 1,
          value: rangeLow,
          disabled: Boolean(props.disabled),
          onChange: (event: Event) => commitRange(Number((event.target as HTMLInputElement).value), rangeHigh, 'input')
        })
        const highInput = h('input', {
          class: `${baseClass}__number`,
          type: 'number',
          min,
          max,
          step: props.step ?? 1,
          value: rangeHigh,
          disabled: Boolean(props.disabled),
          onChange: (event: Event) => commitRange(rangeLow, Number((event.target as HTMLInputElement).value), 'input')
        })
        return [
          rangeInner,
          h('div', { class: [`${baseClass}__input-wrapper`, props.inputSize ? `is-${props.inputSize}` : ''] }, [
            lowInput,
            h('span', { class: `${baseClass}__range-separator` }, '至'),
            highInput
          ])
        ]
      }

      const inner = h(
        'div',
        {
          class: [`${baseClass}__inner`, markEntries.length ? 'has-marks' : ''],
          style: vertical
            ? { height: typeof props.height === 'number' ? `${props.height}px` : props.height || '200px' }
            : undefined,
          onMouseenter: () => state.activate(),
          onMouseleave: () => state.deactivate(),
          onFocusin: () => state.activate(),
          onFocusout: () => state.deactivate()
        },
        [
          h('div', { class: `${baseClass}__runway` }, [
            h('div', {
              class: `${baseClass}__bar`,
              style: vertical ? { height: `${percent}%` } : { width: `${percent}%` }
            }),
            ...stops
          ]),
          h(
            'div',
            {
              class: `${baseClass}__button-wrapper`,
              style: vertical ? { left: '50%', bottom: `${percent}%` } : { left: `${percent}%` }
            },
            [tooltip, h('div', { class: `${baseClass}__button` })]
          ),
          h('input', {
            class: `${baseClass}__input`,
            type: 'range',
            id: props.id,
            min,
            max,
            step: props.step ?? 1,
            value,
            disabled: Boolean(props.disabled),
            'aria-label': props.ariaLabel,
            style: vertical
              ? { width: typeof props.height === 'number' ? `${props.height}px` : props.height || '200px' }
              : undefined,
            onInput: (event: Event) => {
              commit(Number((event.target as HTMLInputElement).value), 'drag')
            },
            onChange: (event: Event) => {
              emit('change', Number((event.target as HTMLInputElement).value))
            }
          }),
          marks
        ]
      )

      if (!props.showInput) {
        return inner
      }

      const numberInput = h('input', {
        class: `${baseClass}__number`,
        type: 'number',
        min,
        max,
        step: props.step ?? 1,
        value,
        disabled: Boolean(props.disabled),
        onChange: (event: Event) => {
          commit(Number((event.target as HTMLInputElement).value), 'input')
        }
      })
      return [
        inner,
        h('div', { class: [`${baseClass}__input-wrapper`, props.inputSize ? `is-${props.inputSize}` : ''] }, [
          props.showInputControls
            ? h(
                'button',
                {
                  class: `${baseClass}__input-control is-minus`,
                  type: 'button',
                  disabled: Boolean(props.disabled),
                  onClick: () => stepTo(-1)
                },
                '−'
              )
            : null,
          numberInput,
          props.showInputControls
            ? h(
                'button',
                {
                  class: `${baseClass}__input-control is-plus`,
                  type: 'button',
                  disabled: Boolean(props.disabled),
                  onClick: () => stepTo(1)
                },
                '+'
              )
            : null
        ])
      ]
    }
  }
}

function rateMax(props: AnyProps): number {
  const max = Number(props.max)
  return Number.isFinite(max) && max >= 1 ? Math.floor(max) : 5
}

function rateValue(props: AnyProps, max: number): number {
  const value = Number(props.modelValue)
  return Number.isFinite(value) ? clamp(value, 0, max) : 0
}

function rateThreshold(value: unknown, fallback: number): number {
  const threshold = Number(value)
  return Number.isFinite(threshold) ? threshold : fallback
}

function rateTier<T>(value: number, source: unknown, low: number, high: number, fallback: T): T {
  if (Array.isArray(source) && source.length) {
    const picked = value <= low ? source[0] : value <= high ? source[1] : source[2]
    return (picked ?? fallback) as T
  }
  if (isObject(source)) {
    const entries = Object.entries(source)
      .map(([key, item]) => [Number(key), item] as [number, unknown])
      .filter(([key]) => Number.isFinite(key))
      .sort((left, right) => left[0] - right[0])
    const matched = entries.find(([key]) => value <= key)
    return (matched ? matched[1] : fallback) as T
  }
  return fallback
}

function rateIcon(icon: unknown): Component | string | undefined {
  if (isString(icon)) {
    return icon || undefined
  }
  if (isFunction(icon)) {
    return icon as Component
  }
  if (isObject(icon) && Object.keys(icon).length) {
    return icon as Component
  }
  return undefined
}

function rateText(props: AnyProps, value: number): string {
  if (props.showScore) {
    const template = isString(props.scoreTemplate) && props.scoreTemplate ? props.scoreTemplate : '{value}'
    return template.replace(/\{\s*value\s*\}/g, String(value))
  }
  if (props.showText && Array.isArray(props.texts)) {
    const text = props.texts[Math.ceil(value) - 1]
    return isNil(text) || text === '' ? '' : String(text)
  }
  return ''
}

export function rateConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  const baseClass = options.baseClass

  function commitValue(props: AnyProps, emit: UiComponentContext['emit'], next: number): void {
    const value = clamp(Math.round(next * 10) / 10, 0, rateMax(props))
    emit('update:modelValue', value)
    emit('change', value)
  }

  return {
    name: options.name,
    baseClass,
    props: options.props,
    classes: (props) => stateClasses(baseClass, props),
    setup: (props, { emit }) => {
      function select(index: number, event: MouseEvent): void {
        if (props.disabled) {
          return
        }
        const value = rateValue(props, rateMax(props))
        let next = index + 1
        if (props.allowHalf) {
          const item = event.currentTarget as HTMLElement | null
          const rect = item?.getBoundingClientRect()
          if (rect && rect.width > 0 && event.clientX - rect.left < rect.width / 2) {
            next = index + 0.5
          }
        }
        if (props.clearable && next === value) {
          next = 0
        }
        commitValue(props, emit, next)
      }

      function handleKeydown(event: KeyboardEvent): void {
        if (props.disabled) {
          return
        }
        const max = rateMax(props)
        const value = rateValue(props, max)
        const step = props.allowHalf ? 0.5 : 1
        let next: number
        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowUp':
            next = value + step
            break
          case 'ArrowLeft':
          case 'ArrowDown':
            next = value - step
            break
          case 'Home':
            next = 0
            break
          case 'End':
            next = max
            break
          default:
            return
        }
        event.preventDefault()
        commitValue(props, emit, next)
      }

      return { select, handleKeydown }
    },
    attrs: (props, state) => {
      const max = rateMax(props)
      const value = rateValue(props, max)
      const text = rateText(props, value)
      return {
        ...baseAttrs(props),
        role: 'slider',
        tabindex: props.disabled ? undefined : 0,
        'aria-valuemin': 0,
        'aria-valuemax': max,
        'aria-valuenow': value,
        'aria-valuetext': text || String(value),
        'aria-disabled': props.disabled ? 'true' : undefined,
        onKeydown: (event: KeyboardEvent) => state.handleKeydown(event)
      }
    },
    content: ({ props, state }) => {
      const max = rateMax(props)
      const value = rateValue(props, max)
      const low = rateThreshold(props.lowThreshold, 2)
      const high = rateThreshold(props.highThreshold, 4)
      const activeIcon = rateIcon(rateTier<unknown>(value, props.icons, low, high, undefined)) ?? Star
      const voidIcon =
        (props.disabled ? (rateIcon(props.disabledVoidIcon) ?? rateIcon(props.voidIcon)) : rateIcon(props.voidIcon)) ??
        Star
      const activeColor = rateTier(value, props.colors, low, high, '')
      const voidColor = props.disabled ? props.disabledVoidColor || props.voidColor : props.voidColor
      const items = Array.from({ length: max }, (_, index) => {
        const filled = value >= index + 1
        const half = Boolean(props.allowHalf) && !filled && value >= index + 0.5
        return h(
          'span',
          {
            class: [`${baseClass}__item`, filled ? 'is-active' : half ? 'is-half' : ''],
            style: voidColor ? { color: voidColor } : undefined,
            onClick: (event: MouseEvent) => state.select(index, event)
          },
          [
            renderIcon(voidIcon, { class: [`${baseClass}__icon`, `${baseClass}__icon--void`] }),
            filled || half
              ? h(
                  'span',
                  {
                    class: `${baseClass}__icon--active`,
                    style: { width: filled ? '100%' : '50%', color: activeColor || undefined }
                  },
                  [renderIcon(activeIcon)]
                )
              : null
          ]
        )
      })
      const text = rateText(props, value)
      return [
        ...items,
        props.showScore || props.showText
          ? h(
              'span',
              { class: `${baseClass}__text`, style: props.textColor ? { color: props.textColor } : undefined },
              text
            )
          : null
      ]
    }
  }
}

function progressColor(percentage: number, source: unknown): string | undefined {
  if (isString(source)) {
    return source || undefined
  }
  if (isFunction(source)) {
    return (source as (value: number) => string)(percentage) || undefined
  }
  if (Array.isArray(source)) {
    const entries = source
      .filter((item) => isObject(item) && Number.isFinite(Number((item as AnyProps).percentage)))
      .sort((left, right) => Number((left as AnyProps).percentage) - Number((right as AnyProps).percentage))
    let matched: string | undefined
    for (const entry of entries) {
      if (percentage >= Number((entry as AnyProps).percentage)) {
        matched = String((entry as AnyProps).color ?? '')
      }
    }
    return matched || undefined
  }
  return undefined
}

export function progressConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  const baseClass = options.baseClass
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    classes: (props) => [
      props.type ? `${baseClass}--${props.type}` : '',
      props.status ? `${baseClass}--status-${props.status}` : '',
      props.indeterminate ? 'is-indeterminate' : ''
    ],
    attrs: (props) => baseAttrs(props),
    content: ({ props }) => {
      const percentage = clamp(Number(props.percentage ?? 0), 0, 100)
      const strokeWidth = Math.max(1, Number(props.strokeWidth ?? 6) || 6)
      const color = progressColor(percentage, props.color)
      const showText = props.showText !== false && !props.indeterminate
      if (props.type === 'circle' || props.type === 'dashboard') {
        const size = Math.max(strokeWidth + 8, Number(props.width ?? 126) || 126)
        const radius = (size - strokeWidth) / 2
        const circumference = 2 * Math.PI * radius
        const center = size / 2
        return h('div', { class: `${baseClass}__circle`, style: { width: `${size}px`, height: `${size}px` } }, [
          h('svg', { viewBox: `0 0 ${size} ${size}`, 'aria-hidden': 'true' }, [
            h('circle', {
              class: `${baseClass}__circle-track`,
              cx: center,
              cy: center,
              r: radius,
              fill: 'none',
              'stroke-width': strokeWidth
            }),
            h('circle', {
              class: `${baseClass}__circle-path`,
              cx: center,
              cy: center,
              r: radius,
              fill: 'none',
              'stroke-width': strokeWidth,
              'stroke-dasharray': `${(percentage / 100) * circumference} ${circumference}`,
              transform: `rotate(-90 ${center} ${center})`,
              style: color ? { stroke: color } : undefined
            })
          ]),
          showText ? h('span', { class: `${baseClass}__circle-text` }, `${percentage}%`) : null
        ])
      }
      return [
        h('div', { class: `${baseClass}__bar`, style: { height: `${strokeWidth}px` } }, [
          h('div', {
            class: `${baseClass}__inner`,
            style: {
              width: `${percentage}%`,
              backgroundColor: color
            }
          })
        ]),
        showText ? h('span', { class: `${baseClass}__text` }, `${percentage}%`) : null
      ]
    }
  }
}

export function imageConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    classes: (props) => [
      ...stateClasses(options.baseClass, props),
      props.fit ? `${options.baseClass}--fit-${props.fit}` : ''
    ],
    tag: () => 'span',
    content: ({ props }) =>
      h('img', {
        class: `${options.baseClass}__inner`,
        src: props.src || undefined,
        alt: props.alt || undefined,
        crossorigin: props.crossorigin || undefined,
        loading: props.lazy ? 'lazy' : props.loading || undefined
      })
  }
}

function resolveVisible(props: AnyProps, visibleKey: string, defaultVisible?: boolean): boolean {
  if (props[visibleKey] !== undefined) {
    return Boolean(props[visibleKey])
  }
  return defaultVisible !== false
}

// aria-labelledby 的标题锚点 id 按实例递增，避免同页多个浮层互相串引用
let overlayPanelTitleSeq = 0

export function overlayConfig(options: {
  name: string
  baseClass: string
  props: AnyProps
  panelClass: string
  titleKey?: string
  closeKey?: string
  iconKey?: string
  visibleKey?: string
  useMask?: boolean
  maskKey?: string
  defaultVisible?: boolean
  focusLoop?: boolean
}): UiComponentConfig {
  const titleKey = options.titleKey ?? 'title'
  const closeKey = options.closeKey ?? 'showClose'
  const visibleKey = options.visibleKey ?? 'modelValue'
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    tag: () => 'div',
    setup(props, { emit, root }) {
      const zIndex = ref(0)
      // 打开前的活动元素（触发元素），关闭后归还焦点；panelTitleId 供 aria-labelledby 锚定标题
      let previousActive: HTMLElement | null = null
      const panelTitleId = `${options.baseClass}-panel-title-${++overlayPanelTitleSeq}`
      watch(
        () => resolveVisible(props, visibleKey, options.defaultVisible),
        (visible) => {
          if (!visible) {
            return
          }
          zIndex.value = resolveZIndex(props.zIndex, nextZIndex())
        },
        { immediate: true }
      )
      useScrollLock(() => resolveVisible(props, visibleKey, options.defaultVisible) && props.lockScroll === true)
      function close(): void {
        emit(`update:${visibleKey}`, false)
        emit('close')
      }

      // beforeClose 声明后由它接管关闭：done() 交给调用方在异步确认后触发。
      // 未声明时保持同步关闭，ESC / 遮罩 / 关闭按钮的既有时序不变。
      function requestClose(): void {
        if (typeof props.beforeClose === 'function') {
          props.beforeClose(close)
          return
        }
        close()
      }

      function handleKeydown(event: KeyboardEvent) {
        // Escape 分层：内层浮层（如 select 面板）已 preventDefault 接管本次按键时，
        // 外层 overlay（dialog/drawer 等）不得再响应，否则一次 Escape 连关两层
        if (event.defaultPrevented) {
          return
        }
        if (event.key !== 'Escape' || props.closeOnPressEscape !== true) {
          return
        }
        if (!resolveVisible(props, visibleKey, options.defaultVisible)) {
          return
        }
        requestClose()
      }

      function getPanel(): HTMLElement | undefined {
        const rootEl = root.value as HTMLElement | undefined
        return rootEl?.querySelector<HTMLElement>(`.${options.panelClass}`) ?? rootEl
      }

      function focusFirst() {
        if (!options.focusLoop || !resolveVisible(props, visibleKey, options.defaultVisible)) {
          return
        }
        const panel = getPanel()
        if (!panel) {
          return
        }
        const focusable = getFocusableElements(panel)
        ;(focusable[0] ?? panel).focus({ preventScroll: true })
      }

      function restoreFocus() {
        const target = previousActive
        previousActive = null
        target?.focus({ preventScroll: true })
      }

      // Tab / Shift+Tab 在面板内循环；与 dialog 原实现同口径，Escape 仍走上面的 handleKeydown
      function handleTabKeydown(event: KeyboardEvent) {
        if (!options.focusLoop || event.key !== 'Tab') {
          return
        }
        if (!resolveVisible(props, visibleKey, options.defaultVisible)) {
          return
        }
        const panel = getPanel()
        if (!panel) {
          return
        }
        const focusable = getFocusableElements(panel)
        if (!focusable.length) {
          event.preventDefault()
          panel.focus({ preventScroll: true })
          return
        }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement as HTMLElement | null
        const outside = !active || !panel.contains(active)
        if (event.shiftKey) {
          if (outside || active === first) {
            event.preventDefault()
            last.focus({ preventScroll: true })
          }
          return
        }
        if (outside || active === last) {
          event.preventDefault()
          first.focus({ preventScroll: true })
        }
      }

      watch(
        () => resolveVisible(props, visibleKey, options.defaultVisible),
        (open) => {
          if (!options.focusLoop) {
            return
          }
          if (open) {
            const active = document.activeElement
            previousActive = active instanceof HTMLElement ? active : null
            nextTick(focusFirst)
          } else {
            restoreFocus()
          }
        },
        { immediate: true }
      )

      onMounted(() => {
        window.addEventListener('keydown', handleKeydown)
        if (options.focusLoop) {
          window.addEventListener('keydown', handleTabKeydown, true)
        }
      })
      onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeydown)
        if (options.focusLoop) {
          // 打开期间直接卸载（路由切换等）也要归还焦点
          window.removeEventListener('keydown', handleTabKeydown, true)
          restoreFocus()
        }
      })
      return {
        requestClose,
        get panelTitleId() {
          return panelTitleId
        },
        get zIndex() {
          return zIndex.value
        }
      }
    },
    classes: (props) => {
      const classes = stateClasses(options.baseClass, props)
      if (!resolveVisible(props, visibleKey, options.defaultVisible)) {
        classes.push('is-hidden')
      }
      if (props.alignCenter) {
        classes.push('is-align-center')
      }
      if (props.center) {
        classes.push('is-center')
      }
      if (props.overflow) {
        classes.push('is-overflow')
      }
      if (props.direction) {
        classes.push(`${options.baseClass}--${props.direction}`)
      }
      return classes
    },
    styles: (props, state) => {
      const zIndex = resolveZIndex(props.zIndex, state.zIndex)
      return zIndex ? { zIndex } : {}
    },
    teleport: (props) => {
      if (!resolveVisible(props, visibleKey, options.defaultVisible)) {
        return undefined
      }
      const target = props.appendTo || (props.teleported || props.appendToBody ? 'body' : '')
      if (!target) {
        return undefined
      }
      return typeof target === 'object' && 'value' in target ? target.value : target
    },
    content: ({ props, slots, states, state }) => {
      if (!resolveVisible(props, visibleKey, options.defaultVisible)) {
        return null
      }
      const close = () => (state.requestClose as () => void)()
      const closeEnabled =
        props[closeKey] !== undefined
          ? props[closeKey] !== false
          : props.closeIcon !== undefined || props.beforeClose !== undefined
      const closeIcon =
        typeof props.closeIcon === 'string' ||
        typeof props.closeIcon === 'function' ||
        (props.closeIcon && (props.closeIcon.render || props.closeIcon.setup))
          ? props.closeIcon
          : X
      const icon =
        options.iconKey && props[options.iconKey]
          ? renderIcon(props[options.iconKey], { class: `${options.panelClass}__icon` })
          : null
      const header =
        props[titleKey] || slots.header || closeEnabled || icon
          ? h('header', { class: `${options.panelClass}__header` }, [
              icon,
              h(
                'span',
                {
                  class: `${options.panelClass}__title`,
                  id: options.focusLoop && (props[titleKey] || slots.header) ? state.panelTitleId : undefined
                },
                slots.header?.() ?? props[titleKey]
              ),
              closeEnabled
                ? h(
                    'button',
                    {
                      class: `${options.panelClass}__close`,
                      type: 'button',
                      'aria-label': 'Close',
                      onClick: close
                    },
                    [renderIcon(closeIcon)]
                  )
                : null
            ])
          : null
      // 全屏尺寸由样式接管，避免 width/height/top 内联值压过全屏规则
      const panelStyle = props.fullscreen
        ? {}
        : {
            width: sizeValue(props.width ?? props.size),
            height: sizeValue(props.height),
            marginTop: sizeValue(props.top),
            // 默认垂直居中；显式指定 top 时改为从顶部定位
            alignSelf: props.top ? 'flex-start' : undefined
          }
      const panelHooks = collectFeatureHooks(states, 'overlayPanel')
      const panelMountProps = panelHooks.length
        ? {
            onVnodeMounted: (vnode: VNode) => {
              panelHooks.forEach((hook) => hook(vnode.el as HTMLElement))
            },
            onVnodeUnmounted: () => {
              panelHooks.forEach((hook) => hook(null))
            }
          }
        : {}
      const closeOnMask = () => {
        if (props.closeOnClickModal === false) {
          return
        }
        close()
      }
      const maskVisible =
        options.useMask !== false &&
        props.modal !== false &&
        (options.maskKey ? props[options.maskKey] !== false : true)
      const nodes = [
        maskVisible ? h('div', { class: `${options.baseClass}__mask`, onClick: closeOnMask }) : null,
        h(
          'section',
          {
            class: options.panelClass,
            style: panelStyle,
            role: props.role || 'dialog',
            'aria-modal': options.focusLoop ? 'true' : undefined,
            'aria-labelledby': options.focusLoop && (props[titleKey] || slots.header) ? state.panelTitleId : undefined,
            onClick: typeof props.onClick === 'function' ? (event: MouseEvent) => props.onClick(event) : undefined,
            ...panelMountProps
          },
          [
            header,
            h('div', { class: `${options.panelClass}__body` }, [slots.default?.() ?? props.message ?? null]),
            slots.footer ? h('footer', { class: `${options.panelClass}__footer` }, [slots.footer()]) : null
          ]
        )
      ]
      return nodes
    }
  }
}

export function buildPagerItems(current: number, pageCount: number, pagerCount: number): Array<number | string> {
  const requested = Math.max(5, Number(pagerCount) || 7)
  const count = Math.min(requested % 2 === 0 ? requested - 1 : requested, pageCount)
  if (pageCount <= count) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }
  const half = Math.floor(count / 2)
  if (current <= count - 2) {
    const items = Array.from({ length: count - 2 }, (_, index) => index + 1)
    return [...items, 'more-right', pageCount]
  }
  if (current >= pageCount - (count - 3)) {
    const items = Array.from({ length: count - 2 }, (_, index) => pageCount - (count - 3) + index)
    return [1, 'more-left', ...items]
  }
  const items = Array.from({ length: count - 4 }, (_, index) => current - half + 2 + index)
  return [1, 'more-left', ...items, 'more-right', pageCount]
}

export function paginationConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    emits: ['update:currentPage', 'current-change', 'update:pageSize', 'size-change', 'prev-click', 'next-click'],
    classes: (props) => [
      ...stateClasses(options.baseClass, props),
      props.background ? `${options.baseClass}--background` : ''
    ],
    setup() {
      const jumpText = ref('')
      return {
        getJumpText: () => jumpText.value,
        setJumpText: (value: string) => {
          jumpText.value = value
        }
      }
    },
    content: ({ props, state, emit, slots }) => {
      const base = options.baseClass
      const pageCount = Math.max(
        1,
        Number(props.pageCount ?? (Math.ceil(Number(props.total ?? 0) / Number(props.pageSize ?? 10)) || 1))
      )
      const current = clamp(Number(props.currentPage ?? 1), 1, pageCount)
      const disabled = Boolean(props.disabled)

      if (props.hideOnSinglePage && pageCount <= 1) {
        return null
      }

      const pagerCount = Math.max(5, Number(props.pagerCount) || 7)
      const pagerItems = buildPagerItems(current, pageCount, pagerCount)

      const change = (page: number) => {
        const next = clamp(page, 1, pageCount)
        if (next === current) {
          return
        }
        emit('update:currentPage', next)
        emit('current-change', next)
      }

      const jumpOffset = Math.max(2, pagerCount - 2)

      const commitJump = () => {
        const page = Number.parseInt(state.getJumpText(), 10)
        state.setJumpText('')
        if (Number.isFinite(page)) {
          change(page)
        }
      }

      const prevNode = h(
        'button',
        {
          class: `${base}__prev`,
          type: 'button',
          disabled: disabled || current <= 1,
          'aria-label': 'Previous page',
          onClick: () => {
            emit('prev-click', current - 1)
            change(current - 1)
          }
        },
        props.prevIcon ? renderIcon(props.prevIcon) : props.prevText || renderIcon(ChevronLeft)
      )

      const pagerNode = pagerItems.map((item) =>
        typeof item === 'number'
          ? h(
              'button',
              {
                key: item,
                type: 'button',
                class: [`${base}__pager`, item === current ? 'is-active' : ''],
                disabled,
                'aria-current': item === current ? 'page' : undefined,
                onClick: () => change(item)
              },
              String(item)
            )
          : h(
              'button',
              {
                key: item,
                type: 'button',
                class: `${base}__more`,
                disabled,
                'aria-label': item === 'more-left' ? 'Previous pages' : 'Next pages',
                onClick: () => change(current + (item === 'more-left' ? -jumpOffset : jumpOffset))
              },
              '•••'
            )
      )

      const nextNode = h(
        'button',
        {
          class: `${base}__next`,
          type: 'button',
          disabled: disabled || current >= pageCount,
          'aria-label': 'Next page',
          onClick: () => {
            emit('next-click', current + 1)
            change(current + 1)
          }
        },
        props.nextIcon ? renderIcon(props.nextIcon) : props.nextText || renderIcon(ChevronRight)
      )

      const total = Number(props.total ?? 0)
      const totalNode = h('span', { class: `${base}__total` }, `共 ${total} 条`)

      const pageSizes = Array.isArray(props.pageSizes)
        ? props.pageSizes.map((size) => Number(size)).filter((size) => Number.isFinite(size) && size > 0)
        : []
      const sizesNode = pageSizes.length
        ? h('span', { class: `${base}__sizes` }, [
            h(
              'select',
              {
                class: `${base}__sizes-select`,
                value: Number(props.pageSize ?? pageSizes[0]),
                disabled,
                'aria-label': '每页条数',
                onChange: (event: Event) => {
                  const next = Number((event.target as HTMLSelectElement).value)
                  if (!Number.isFinite(next) || next <= 0 || next === Number(props.pageSize)) {
                    return
                  }
                  emit('update:pageSize', next)
                  emit('size-change', next)
                }
              },
              pageSizes.map((size) => h('option', { key: size, value: size }, `${size} 条/页`))
            )
          ])
        : null

      const jumperNode = h('span', { class: `${base}__jump` }, [
        '前往',
        h('input', {
          class: `${base}__jump-input`,
          value: state.getJumpText(),
          disabled,
          inputmode: 'numeric',
          'aria-label': '页码',
          onInput: (event: Event) => {
            state.setJumpText((event.target as HTMLInputElement).value)
          },
          onKeydown: (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
              commitJump()
            }
          },
          onBlur: commitJump
        }),
        '页'
      ])

      const layout = typeof props.layout === 'string' && props.layout.trim() ? props.layout : 'prev, pager, next'
      const fragment = (part: string): VNodeChild => {
        switch (part) {
          case 'total':
            return totalNode
          case 'sizes':
            return sizesNode
          case 'prev':
            return prevNode
          case 'pager':
            return pagerNode
          case 'next':
            return nextNode
          case 'jumper':
            return jumperNode
          case 'slot':
          case '->':
            return slots.default?.() ?? null
          default:
            return null
        }
      }
      return layout
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map(fragment)
    }
  }
}

const UPLOAD_STATUS_TEXT: Record<string, string> = {
  ready: '',
  uploading: '上传中',
  success: '',
  fail: '失败',
  error: '失败'
}

function matchesAccept(file: File, accept: unknown): boolean {
  const patterns = String(accept ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  if (!patterns.length) {
    return true
  }
  const name = String(file.name ?? '').toLowerCase()
  const type = String(file.type ?? '').toLowerCase()
  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) {
      return name.endsWith(pattern)
    }
    if (pattern.endsWith('/*')) {
      return type.startsWith(pattern.slice(0, -1))
    }
    return type === pattern
  })
}

export function uploadConfig(options: { name: string; baseClass: string; props: AnyProps }): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    emits: ['change', 'update:file-list'],
    classes: (props) => [
      ...stateClasses(options.baseClass, props),
      props.draggable ? 'is-drag' : '',
      `is-${String(props.listType ?? 'text')}`
    ],
    setup() {
      const dragging = ref(false)
      return {
        enableDragging() {
          dragging.value = true
        },
        disableDragging() {
          dragging.value = false
        },
        get dragging() {
          return dragging.value
        }
      }
    },
    content: ({ props, emit, slots, state }) => {
      const baseClass = options.baseClass
      const files = Array.isArray(props.fileList) ? props.fileList : []
      const listType = String(props.listType ?? 'text')

      function handleFiles(picked: File[]) {
        if (props.disabled || !picked.length) {
          return
        }
        const allowed = picked.filter((file) => matchesAccept(file, props.accept))
        const beforeUpload = typeof props.beforeUpload === 'function' ? props.beforeUpload : null
        let accepted = beforeUpload ? allowed.filter((file) => beforeUpload(file) !== false) : allowed
        const limit = Number(props.limit)
        if (Number.isFinite(limit) && limit > 0 && files.length + accepted.length > limit) {
          if (typeof props.onExceed === 'function') {
            props.onExceed(accepted, files)
          }
          accepted = accepted.slice(0, Math.max(0, limit - files.length))
        }
        if (!accepted.length) {
          return
        }
        emit('change', accepted)
        emit('update:file-list', [...files, ...accepted])
      }

      function removeFile(file: AnyProps, index: number) {
        if (props.disabled) {
          return
        }
        if (typeof props.beforeRemove === 'function' && props.beforeRemove(file, files) === false) {
          return
        }
        emit(
          'update:file-list',
          files.filter((_: unknown, position: number) => position !== index)
        )
        if (typeof props.onRemove === 'function') {
          props.onRemove(file, files)
        }
      }

      function fileName(file: AnyProps): string {
        return String(file?.name ?? file?.uid ?? file)
      }

      function previewUrl(file: AnyProps): string {
        return typeof file?.url === 'string' ? file.url : ''
      }

      function thumbFallback(file: AnyProps): string {
        const matched = /\.([a-z0-9]{1,4})$/i.exec(fileName(file))
        return matched ? matched[1].toUpperCase() : 'FILE'
      }

      function statusOf(file: AnyProps): string {
        return String(file?.status ?? '')
      }

      function statusText(file: AnyProps): string {
        const status = statusOf(file)
        return UPLOAD_STATUS_TEXT[status] ?? status
      }

      function statusNode(file: AnyProps): VNodeChild {
        const text = statusText(file)
        if (!text) {
          return null
        }
        const suffix = listType === 'picture-card' ? '__mask' : '__status'
        return h('span', { class: `${baseClass}${suffix}` }, text)
      }

      function triggerLabel(): VNodeChild {
        const custom = slots.default?.()
        if (custom) {
          return custom
        }
        if (listType === 'picture-card') {
          return [
            renderIcon(Plus, { class: `${baseClass}__trigger-icon` }),
            h('span', { class: `${baseClass}__hint` }, '上传')
          ]
        }
        if (props.draggable) {
          return [
            renderIcon(UploadIcon, { class: `${baseClass}__trigger-icon` }),
            h('span', { class: `${baseClass}__hint` }, '将文件拖到此处，或点击上传')
          ]
        }
        return h('span', { class: `${baseClass}__hint` }, '选择文件')
      }

      const trigger = h(
        'label',
        {
          class: [`${baseClass}__trigger`, props.draggable ? 'is-drag' : '', state.dragging ? 'is-dragover' : ''],
          onDragenter: (event: DragEvent) => {
            if (!props.draggable || props.disabled) {
              return
            }
            event.preventDefault()
            state.enableDragging()
          },
          onDragover: (event: DragEvent) => {
            if (!props.draggable || props.disabled) {
              return
            }
            event.preventDefault()
            state.enableDragging()
          },
          onDragleave: () => {
            state.disableDragging()
          },
          onDrop: (event: DragEvent) => {
            event.preventDefault()
            state.disableDragging()
            if (!props.draggable || props.disabled) {
              return
            }
            handleFiles(Array.from(event.dataTransfer?.files ?? []))
          }
        },
        [
          h('input', {
            type: 'file',
            multiple: Boolean(props.multiple),
            accept: props.accept,
            disabled: Boolean(props.disabled),
            onChange: (event: Event) => {
              const input = event.target as HTMLInputElement
              handleFiles(Array.from(input.files ?? []))
              input.value = ''
            }
          }),
          triggerLabel()
        ]
      )

      if (!props.showFileList || !files.length) {
        return [trigger]
      }

      const list = h(
        'ul',
        // picture-card 下列表用 display:contents 去掉盒子，补 role 保住列表语义
        { class: [`${baseClass}__list`, `is-${listType}`], role: 'list' },
        files.map((file: AnyProps, index: number) =>
          h(
            'li',
            {
              key: file?.uid ?? file?.name ?? index,
              role: 'listitem',
              class: [`${baseClass}__item`, statusOf(file) ? `is-${statusOf(file)}` : '']
            },
            [
              listType === 'text'
                ? null
                : h('span', { class: `${baseClass}__thumb` }, [
                    previewUrl(file)
                      ? h('img', { src: previewUrl(file), alt: fileName(file) })
                      : h('span', { class: `${baseClass}__thumb-placeholder` }, thumbFallback(file))
                  ]),
              h('span', { class: `${baseClass}__file-name` }, fileName(file)),
              statusNode(file),
              h(
                'button',
                {
                  class: `${baseClass}__remove`,
                  type: 'button',
                  disabled: Boolean(props.disabled),
                  'aria-label': '移除文件',
                  onClick: () => removeFile(file, index)
                },
                '×'
              )
            ]
          )
        )
      )
      return [trigger, list]
    }
  }
}

type TriggerMode = 'click' | 'hover' | 'contextmenu'

function resolveTrigger(
  trigger: TriggerMode | ((props: AnyProps) => TriggerMode) | undefined,
  props: AnyProps
): TriggerMode {
  const value = typeof trigger === 'function' ? trigger(props) : trigger
  return value === 'click' || value === 'contextmenu' ? value : 'hover'
}

function resolveBoolean(
  option: boolean | ((props: AnyProps) => boolean) | undefined,
  props: AnyProps,
  fallback = false
): boolean {
  const value = typeof option === 'function' ? option(props) : option
  return value === undefined ? fallback : Boolean(value)
}

// Escape 关闭浮层的登记栈：同屏多个浮层展开时（对话框里的下拉、嵌套 Popover），
// 一次按键只关最上层那个，避免一层 Esc 把所有层全收起。
const escapeHandlers: Array<() => void> = []

function handleEscapeKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') {
    return
  }
  escapeHandlers[escapeHandlers.length - 1]?.()
}

function pushEscapeHandler(handler: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }
  if (escapeHandlers.length === 0) {
    window.addEventListener('keydown', handleEscapeKeydown)
  }
  escapeHandlers.push(handler)
  return () => {
    const index = escapeHandlers.indexOf(handler)
    if (index >= 0) {
      escapeHandlers.splice(index, 1)
    }
    if (escapeHandlers.length === 0) {
      window.removeEventListener('keydown', handleEscapeKeydown)
    }
  }
}

export function triggerConfig(options: {
  name: string
  baseClass: string
  props: AnyProps
  panelClass: string
  defaultOpen?: boolean
  trigger?: TriggerMode | ((props: AnyProps) => TriggerMode)
  panel: (context: UiComponentContext) => VNodeChild
  panelStyle?: (props: AnyProps) => CSSProperties
  panelClassName?: (props: AnyProps) => unknown
  closeOnPanelClick?: boolean | ((props: AnyProps) => boolean)
  enterable?: (props: AnyProps) => boolean
  autoClose?: (props: AnyProps) => number
}): UiComponentConfig {
  return {
    name: options.name,
    baseClass: options.baseClass,
    props: options.props,
    classes: (props) => stateClasses(options.baseClass, props),
    setup(props, { emit }) {
      // visible 声明（非 undefined）时视为受控：展开态由 visible 决定，未声明时回到内部状态
      const open = ref(props.visible !== undefined ? Boolean(props.visible) : Boolean(options.defaultOpen))
      const triggerRef = shallowRef<HTMLElement>()
      const panelRef = shallowRef<HTMLElement>()
      let showTimer: ReturnType<typeof setTimeout> | null = null
      let hideTimer: ReturnType<typeof setTimeout> | null = null
      let closeTimer: ReturnType<typeof setTimeout> | null = null

      function mode() {
        return resolveTrigger(options.trigger, props)
      }

      function clearShowTimer() {
        if (showTimer) {
          clearTimeout(showTimer)
        }
        showTimer = null
      }

      function clearHideTimer() {
        if (hideTimer) {
          clearTimeout(hideTimer)
        }
        hideTimer = null
      }

      function clearCloseTimer() {
        if (closeTimer) {
          clearTimeout(closeTimer)
        }
        closeTimer = null
      }

      function resolveDelay(primary: unknown, fallback: unknown): number {
        const value = Number(primary ?? fallback ?? 0)
        return Number.isFinite(value) && value > 0 ? value : 0
      }

      function scheduleAutoClose() {
        clearCloseTimer()
        const delay = Number(options.autoClose?.(props) ?? 0)
        if (!Number.isFinite(delay) || delay <= 0) {
          return
        }
        closeTimer = setTimeout(hideNow, delay)
      }

      function applyShow() {
        clearShowTimer()
        clearHideTimer()
        if (open.value) {
          return
        }
        open.value = true
        emit('show')
        scheduleAutoClose()
      }

      function applyHide() {
        clearShowTimer()
        clearHideTimer()
        clearCloseTimer()
        if (!open.value) {
          return
        }
        open.value = false
        emit('hide')
      }

      // 受控态下交互（点击 / 悬停 / 外点 / 面板点击 / 计时器）都不允许改写展开态，
      // 收起与展开只由 visible 的取值决定
      function isControlledVisible() {
        return props.visible !== undefined
      }

      function showNow() {
        if (isControlledVisible()) {
          return
        }
        applyShow()
      }

      function hideNow() {
        if (isControlledVisible()) {
          return
        }
        applyHide()
      }

      function scheduleShow() {
        if (props.disabled) {
          return
        }
        clearHideTimer()
        if (open.value) {
          clearShowTimer()
          return
        }
        const delay = resolveDelay(props.showTimeout, props.showAfter)
        if (!delay) {
          showNow()
          return
        }
        clearShowTimer()
        showTimer = setTimeout(showNow, delay)
      }

      function scheduleHide() {
        clearShowTimer()
        if (!open.value) {
          clearHideTimer()
          return
        }
        const delay = resolveDelay(props.hideTimeout, props.hideAfter)
        if (!delay) {
          hideNow()
          return
        }
        clearHideTimer()
        hideTimer = setTimeout(hideNow, delay)
      }

      function toggle() {
        if (props.disabled) {
          return
        }
        if (open.value) {
          hideNow()
        } else {
          showNow()
        }
      }

      const floating = useFloatingPanel({
        props,
        open: () => open.value,
        close: hideNow,
        trigger: triggerRef,
        panel: panelRef,
        placement: () => props.placement ?? 'bottom',
        offset: () => Number(props.offset ?? 8),
        arrowOffset: () => Number(props.arrowOffset ?? 8),
        fallbackPlacements: () => props.fallbackPlacements
      })

      function handleDocumentPointerDown(event: Event) {
        const current = mode()
        if (!open.value || (current !== 'click' && current !== 'contextmenu')) {
          return
        }
        const target = event.target as Node | null
        if (target && (triggerRef.value?.contains(target) || panelRef.value?.contains(target))) {
          return
        }
        hideNow()
      }

      watch(
        () => props.visible,
        (value) => {
          if (value === undefined) {
            return
          }
          if (value) {
            applyShow()
          } else {
            applyHide()
          }
        }
      )

      // 展开期间接管 Escape：closeOnPressEscape 显式给 false 才关掉这条通路，
      // 未声明该 prop 的浮层（trigger 型组件）默认都能用 Escape 收起
      let detachEscape: (() => void) | null = null
      watch(
        () => open.value,
        (value) => {
          if (value && props.closeOnPressEscape !== false) {
            if (!detachEscape) {
              detachEscape = pushEscapeHandler(hideNow)
            }
            return
          }
          if (detachEscape) {
            detachEscape()
            detachEscape = null
          }
        },
        { immediate: true }
      )

      onMounted(() => {
        document.addEventListener('pointerdown', handleDocumentPointerDown, true)
      })

      onBeforeUnmount(() => {
        clearShowTimer()
        clearHideTimer()
        clearCloseTimer()
        if (detachEscape) {
          detachEscape()
          detachEscape = null
        }
        document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
      })

      return {
        show: showNow,
        hide: hideNow,
        scheduleShow,
        scheduleHide,
        clearCloseTimer,
        toggle,
        triggerRef,
        panelRef,
        get position() {
          return floating.position.value
        },
        get arrowStyle() {
          return floating.arrowStyle.value
        },
        get actualSide() {
          return floating.actualSide.value
        },
        get open() {
          return open.value
        }
      }
    },
    attrs: (props, state) => {
      const current = resolveTrigger(options.trigger, props)
      // 触发器是带 tabindex 的 div：Tab 到位后必须还能用 Enter/Space 打开，
      // 否则纯 div 触发器对键盘是死的。里层本来就有 button/a/input 时不接管，
      // 那类节点的原生 click 已经会走到 onClick，重复一次会把状态顶回去。
      const keyboard = {
        onKeydown: (event: KeyboardEvent) => {
          if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') {
            return
          }
          const target = event.target as HTMLElement | null
          if (target?.closest?.('button, a, input, select, textarea, [role="button"]')) {
            return
          }
          event.preventDefault()
          state.toggle()
        }
      }
      if (current === 'hover') {
        return {
          onMouseenter: () => state.scheduleShow(),
          onMouseleave: () => state.scheduleHide(),
          ...keyboard
        }
      }
      if (current === 'contextmenu') {
        return {
          onContextmenu: (event: Event) => {
            event.preventDefault()
            state.toggle()
          },
          ...keyboard
        }
      }
      return {
        onClick: () => state.toggle(),
        ...keyboard
      }
    },
    styles: () => ({ position: 'relative' }),
    content: ({ slots, state, props, ...rest }) => {
      const panelVisible = state.open
      const current = resolveTrigger(options.trigger, props)
      const enterable = current === 'hover' && (options.enterable ? options.enterable(props) : true)
      const panel =
        panelVisible || props.persistent
          ? h(
              'div',
              {
                ref: state.panelRef,
                class: [
                  options.panelClass,
                  'ui-floating-panel',
                  isString(props.size) && props.size ? `${options.panelClass}--size-${props.size}` : null,
                  props.effect === 'dark' ? 'is-dark' : null,
                  props.popperClass,
                  options.panelClassName?.(props),
                  `is-${state.actualSide}`
                ],
                role: props.role || undefined,
                'aria-hidden': panelVisible ? undefined : 'true',
                style: [
                  options.panelStyle?.(props),
                  props.popperStyle,
                  state.position,
                  state.position && Object.keys(state.position).length ? null : { visibility: 'hidden' },
                  panelVisible ? null : { display: 'none' }
                ],
                ...(enterable
                  ? {
                      onMouseenter: () => {
                        state.scheduleShow()
                        state.clearCloseTimer()
                      },
                      onMouseleave: () => state.scheduleHide()
                    }
                  : {}),
                onClick: (event: Event) => {
                  event.stopPropagation()
                  if (resolveBoolean(options.closeOnPanelClick, props)) {
                    state.hide()
                  }
                }
              },
              [
                options.panel({ props, slots, state, ...rest }),
                props.showArrow && panelVisible
                  ? h('span', { class: 'ui-floating-arrow', style: state.arrowStyle })
                  : null
              ]
            )
          : null

      const target = props.appendTo
      const teleportTarget = target && typeof target === 'object' && 'value' in target ? target.value : target
      return [
        h(
          'div',
          {
            class: `${options.baseClass}__trigger`,
            ref: state.triggerRef,
            id: props.id,
            tabindex: props.tabindex,
            'aria-label': props.ariaLabel,
            'aria-expanded': panelVisible
          },
          [slots.default?.() ?? null]
        ),
        panel && props.teleported !== false ? h(Teleport, { to: teleportTarget || 'body' }, [panel]) : panel
      ]
    }
  }
}

export function slotContent(content: VNodeChild): VNodeChild {
  return content
}
