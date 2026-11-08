import type { PropType } from 'vue'
import { computed } from 'vue'
import type { UiFeature } from '../../shared/feature'
import type { UiLocale } from '../../shared/config'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import { UI_CONFIG_KEY } from '../../shared/config'
import './core.css'

const configProviderBaseProps = {
  size: { type: String },
  locale: { type: Object as PropType<UiLocale> }
}

export function createConfigProvider(features: UiFeature[] = []) {
  const base = wrapperConfig({
    name: 'UiConfigProvider',
    baseClass: 'ui-config-provider',
    props: configProviderBaseProps,
    defaultTag: 'div'
  })
  return createUiComponent(
    {
      ...base,
      setup: (props, { provide }) => {
        provide(
          UI_CONFIG_KEY,
          computed(() => ({ size: (props.size as string) || undefined, locale: props.locale as UiLocale | undefined }))
        )
        return {}
      }
    },
    features
  )
}
