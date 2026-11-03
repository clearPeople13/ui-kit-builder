<script setup lang="ts">
import { Button as BrandedButton, Input as BrandedInput } from '@demo/ui-kit-branded'
import { Button as CoreButton, Input as CoreInput } from '@demo/ui-kit-core'
import { Button as FullButton } from '@demo/ui-kit-full'
</script>

<template>
  <!-- core 未启用任何 Button 特性，逐个 prop 单独验证 -->
  <CoreButton bg-color="#3366ff" />
  <CoreButton :auto-contrast="true" />
  <CoreButton gradient />
  <CoreButton :gradient-angle="45" />
  <CoreButton plain />
  <CoreButton loading />

  <!-- core Input 未启用 clearable -->
  <CoreInput clearable />

  <!-- full 启用了 gradientAngle，但类型必须是 number -->
  <FullButton :gradient-angle="'45'" />

  <!-- 对照组：各包已启用属性不应报错 -->
  <CoreButton type="primary" size="small" :disabled="false" />
  <BrandedButton bg-color="#3366ff" :auto-contrast="true" gradient :gradient-angle="45" />
  <BrandedInput model-value="hello" clearable />
  <FullButton bg-color="#3366ff" :auto-contrast="true" gradient :gradient-angle="45" loading round />
  <CoreInput model-value="hello" placeholder="Name" />
</template>
