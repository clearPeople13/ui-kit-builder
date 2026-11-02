<script setup lang="ts">
import { Button as BgColorButton, Input as BgColorInput } from '@demo/ui-kit-bg-color'
import { Button as CoreButton, Input as CoreInput, Scrollbar } from '@demo/ui-kit-core'
import { Button as FullButton, Input as FullInput } from '@demo/ui-kit-full'
</script>

<template>
  <CoreButton type="primary" size="small" :disabled="false">Core</CoreButton>
  <BgColorButton type="success" bg-color="#3366ff" :auto-contrast="true">BG</BgColorButton>
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
  <BgColorInput model-value="hello" placeholder="BG" />
  <FullInput model-value="hello" placeholder="Full"  />

  <Scrollbar :height="80">
    <div>scroll</div>
  </Scrollbar>
</template>
