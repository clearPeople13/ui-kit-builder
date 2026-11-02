import type { Component } from 'vue'
import { defineComponent, h, inject } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { UI_CONFIG_KEY } from '../../shared/config'
import { BUTTON_GROUP_CONTEXT, type ButtonGroupContext } from './button-group/core'
import {
  collectFeatureClasses,
  collectFeatureFragments,
  collectFeatureStyles,
  isFeatureDisabled,
  mergeFeatureProps,
  resolveFeatureStates,
  transformFeatureContent
} from '../../shared/feature'
import './core.css'

const buttonTypes = ['default', 'primary', 'success', 'warning', 'info', 'danger', '']
const buttonNativeTypes = ['button', 'submit', 'reset']
const buttonSizes = ['large', 'default', 'small', '']

const baseProps = {
  size: {
    type: String,
    values: buttonSizes,
    default: ''
  },
  type: {
    type: String,
    values: buttonTypes,
    default: ''
  },
  disabled: Boolean,
  nativeType: {
    type: String,
    values: buttonNativeTypes,
    default: 'button'
  },
  autofocus: Boolean,
  tag: {
    type: [String, Object, Function],
    default: 'button'
  }
}

export function createButton(features: UiFeature[] = []) {
  return defineComponent({
    name: 'UiButton',
    inheritAttrs: false,
    props: { ...baseProps, ...mergeFeatureProps(features) },
    setup(props, { attrs, slots }) {
      const resolved = props as Record<string, any>
      const globalConfig = inject(UI_CONFIG_KEY, undefined)
      const groupContext = inject(BUTTON_GROUP_CONTEXT, null) as ButtonGroupContext | null
      const states = resolveFeatureStates(features, resolved)

      return function render() {
        const tag = (resolved.tag ?? 'button') as string | Component
        const size = resolved.size || groupContext?.size() || globalConfig?.value.size || 'default'
        const type = resolved.type || groupContext?.type() || 'default'
        const prefix = collectFeatureFragments(states, 'prefix')
        const suffix = collectFeatureFragments(states, 'suffix')
        const content = transformFeatureContent(states, slots.default?.() ?? null)

        return h(
          tag,
          {
            ...attrs,
            type: tag === 'button' ? resolved.nativeType : undefined,
            class: [
              attrs.class,
              'ui-button',
              `ui-button--${type}`,
              `ui-button--size-${size}`,
              ...collectFeatureClasses(states)
            ],
            style: { ...(attrs.style as Record<string, any>), ...collectFeatureStyles(states) },
            disabled: Boolean(resolved.disabled) || isFeatureDisabled(states) || undefined,
            autofocus: resolved.autofocus || undefined
          },
          [
            ...prefix.map((renderFragment) => renderFragment()),
            content,
            ...suffix.map((renderFragment) => renderFragment())
          ]
        )
      }
    }
  })
}
