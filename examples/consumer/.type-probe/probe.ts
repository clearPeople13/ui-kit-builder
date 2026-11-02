import type { DefineComponent, ComponentPublicInstance } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'
type Props = { a?: string }
type Methods = { focus: () => void }
type Instance = ComponentPublicInstance<Props, {}, {}, {}, Methods>
declare const X: DefineComponent<Props, {}, {}, {}, Methods> & { new (): Instance }
type I = InstanceType<typeof X>
declare const i: I
i.focus()
const p: Props = i.$props
type CP = ComponentProps<typeof X>
const cp: CP = { a: 'x' }
const bad: CP = { b: 1 }
export const _ = [p, cp, bad]
