<script setup lang="ts">
import { Button as BrandedButton, Input as BrandedInput } from '@demo/ui-kit-branded'
import { Button as CoreButton, Input as CoreInput, Scrollbar } from '@demo/ui-kit-core'
import { Button as FullButton, Input as FullInput } from '@demo/ui-kit-full'
</script>

<template>
  <CoreButton type="primary" size="small" :disabled="false">Core</CoreButton>
  <BrandedButton type="success" bg-color="#3366ff" :auto-contrast="true" gradient :gradient-angle="45">
    Branded
  </BrandedButton>
  <FullButton
    type="warning"
    bg-color="#3366ff"
    :auto-contrast="true"
    gradient
    :gradient-angle="45"
    round
    loading
  >
    Full
  </FullButton>

  <CoreInput model-value="hello" placeholder="Core" />
  <BrandedInput model-value="hello" placeholder="Branded" clearable />
  <FullInput model-value="hello" placeholder="Full" />

  <Scrollbar :height="80">
    <div>scroll</div>
  </Scrollbar>
</template>
