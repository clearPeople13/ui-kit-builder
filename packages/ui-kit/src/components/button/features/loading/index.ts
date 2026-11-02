import type { Component } from 'vue'
import { computed, h } from 'vue'
import { renderIcon } from '../../../../shared/icon'
import './style.css'

export const buttonLoadingFeature = {
  id: 'button.loading',
  props: {
    loading: Boolean,
    loadingIcon: { type: [String, Object, Function] }
  },
  setup(props: { loading?: boolean; loadingIcon?: Component | string }) {
    const loading = computed(() => Boolean(props.loading))

    return {
      disabled: loading,
      prefix: () => {
        if (!loading.value) {
          return null
        }
        return props.loadingIcon
          ? renderIcon(props.loadingIcon, { class: 'ui-button__loading' })
          : h('span', { class: 'ui-button__spinner' })
      }
    }
  }
}
