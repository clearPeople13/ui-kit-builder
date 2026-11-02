import { computed } from 'vue'
import type { UiFeature } from '../../shared/feature'
import { createUiComponent } from '../../shared/component'
import { wrapperConfig } from '../../shared/behavior'
import { UI_CONFIG_KEY } from '../../shared/config'
import './core.css'

const configProviderBaseProps = {
  size: { type: String }
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
          computed(() => ({ size: (props.size as string) || undefined }))
        )
        return {}
      }
    },
    features
  )
}
