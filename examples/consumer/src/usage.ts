import type { ButtonProps as BgColorButtonProps, InputProps as BgColorInputProps } from '@demo/ui-kit-bg-color'
import type {
  ButtonProps as CoreButtonProps,
  InputInstance as CoreInputInstance,
  InputProps as CoreInputProps,
  ScrollbarInstance as CoreScrollbarInstance,
  ScrollbarProps as CoreScrollbarProps
} from '@demo/ui-kit-core'
import type {
  ButtonProps as FullButtonProps,
  InputInstance as FullInputInstance,
  InputMethods as FullInputMethods,
  InputProps as FullInputProps,
  ScrollbarInstance as FullScrollbarInstance
} from '@demo/ui-kit-full'
import type { ComponentProps } from 'vue-component-type-helpers'
import { Button as BgColorButton } from '@demo/ui-kit-bg-color'
import { Button as CoreButton, Input as CoreInput } from '@demo/ui-kit-core'
import { Button as FullButton, Input as FullInput } from '@demo/ui-kit-full'

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Expect<T extends true> = T

export const coreButton: CoreButtonProps = {
  size: 'small',
  type: 'primary',
  disabled: false,
  nativeType: 'button',
  autofocus: false,
  tag: 'button'
}

export const bgColorButton: BgColorButtonProps = {
  type: 'primary',
  bgColor: '#3366ff',
  autoContrast: true
}

export const fullButton: FullButtonProps = {
  type: 'primary',
  plain: true,
  round: true,
  color: '#3366ff',
  loading: false,
  autoInsertSpace: true,
  bgColor: '#3366ff',
  autoContrast: true,
  gradient: true,
  gradientAngle: 45
}

export const coreInput: CoreInputProps = { modelValue: 'hello', placeholder: 'Name', type: 'text' }
export const fullInput: FullInputProps = { modelValue: 'hello', placeholder: 'Name' }
export const coreScrollbar: CoreScrollbarProps = { height: 120, native: false, minSize: 20 }

type CoreComponentProps = ComponentProps<typeof CoreButton>
type BgColorComponentProps = ComponentProps<typeof BgColorButton>
type FullComponentProps = ComponentProps<typeof FullButton>
type CoreInputComponentProps = ComponentProps<typeof CoreInput>
type FullInputComponentProps = ComponentProps<typeof FullInput>

export const coreComponent: CoreComponentProps = { type: 'primary', size: 'small' }
export const bgColorComponent: BgColorComponentProps = { bgColor: '#3366ff', type: 'success' }
export const fullComponent: FullComponentProps = { gradient: true, gradientAngle: 45, round: true }
export const coreInputComponent: CoreInputComponentProps = { modelValue: 'hello' }
export const fullInputComponent: FullInputComponentProps = { modelValue: 'hello' }

export const coreRejectsBgColor: CoreButtonProps = {
  // @ts-expect-error core 包未启用 button.bg-color
  bgColor: '#3366ff'
}

export const coreRejectsGradient: CoreComponentProps = {
  // @ts-expect-error core 组件未启用 button.gradient
  gradient: true
}

export const coreRejectsLoading: CoreButtonProps = {
  // @ts-expect-error core 包未启用 button.loading
  loading: true
}

export const bgColorRejectsGradient: BgColorButtonProps = {
  // @ts-expect-error bg-color 包未启用 button.gradient
  gradient: true
}

export const bgColorRejectsAppearance: BgColorComponentProps = {
  // @ts-expect-error bg-color 包未启用 button.appearance
  plain: true
}

export const fullRejectsStringAngle: FullButtonProps = {
  // @ts-expect-error gradientAngle 必须是 number
  gradientAngle: '45'
}

export const coreInputRejectsClearable: CoreInputProps = {
  // @ts-expect-error core 包未启用 input.clearable
  clearable: true
}

export const fullInputAcceptsPassword: FullInputComponentProps = {
  showPassword: true
}

export type FullInputMethodsExact = Expect<Equal<keyof FullInputMethods, 'clear' | 'focus' | 'blur' | 'select'>>

export const fullInputFocus: FullInputInstance['focus'] = (null as unknown as FullInputInstance).focus
export const fullInputClearViaValue = (null as unknown as InstanceType<typeof FullInput>).clear
export const fullScrollbarSetScrollTop: FullScrollbarInstance['setScrollTop'] = (
  null as unknown as FullScrollbarInstance
).setScrollTop

// @ts-expect-error core 包未启用 input.methods，实例上没有 focus
export const coreRejectsInputFocus = (null as unknown as CoreInputInstance).focus
// @ts-expect-error core 包未启用 input.clearable，实例上没有 clear
export const coreRejectsInputClear = (null as unknown as CoreInputInstance).clear
// @ts-expect-error core 包未启用 scrollbar.methods，实例上没有 setScrollTop
export const coreRejectsScrollbarSetScrollTop = (null as unknown as CoreScrollbarInstance).setScrollTop

export type CoreButtonKeysExact = Expect<
  Equal<keyof CoreButtonProps, 'size' | 'type' | 'disabled' | 'nativeType' | 'autofocus' | 'tag'>
>
export type BgColorButtonKeysExact = Expect<
  Equal<
    keyof BgColorButtonProps,
    'size' | 'type' | 'disabled' | 'nativeType' | 'autofocus' | 'tag' | 'bgColor' | 'autoContrast'
  >
>
export type FullButtonKeysExact = Expect<
  Equal<
    keyof FullButtonProps,
    | 'size'
    | 'type'
    | 'disabled'
    | 'nativeType'
    | 'autofocus'
    | 'tag'
    | 'plain'
    | 'text'
    | 'link'
    | 'bg'
    | 'dark'
    | 'round'
    | 'circle'
    | 'dashed'
    | 'color'
    | 'icon'
    | 'loading'
    | 'loadingIcon'
    | 'autoInsertSpace'
    | 'bgColor'
    | 'autoContrast'
    | 'gradient'
    | 'gradientAngle'
  >
>
export type CoreComponentHasNoBgColor = Expect<Equal<'bgColor' extends keyof CoreComponentProps ? true : false, false>>
export type BgColorComponentHasNoGradient = Expect<
  Equal<'gradient' extends keyof BgColorComponentProps ? true : false, false>
>
export type FullComponentHasGradient = Expect<Equal<'gradient' extends keyof FullComponentProps ? true : false, true>>
export type CoreInputHasNoClearable = Expect<Equal<'clearable' extends keyof CoreInputProps ? true : false, false>>
export type FullInputHasPassword = Expect<Equal<'showPassword' extends keyof FullInputProps ? true : false, true>>
export type BgColorInputPropsMatchCore = Expect<Equal<keyof BgColorInputProps, keyof CoreInputProps>>
