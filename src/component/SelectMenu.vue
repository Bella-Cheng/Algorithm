<script setup lang="ts" generic="T extends string | number">
import { ref } from 'vue'
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectViewport,
} from 'reka-ui'
import type { SelectOption } from '@/types/select'

withDefaults(
  defineProps<{
    options: SelectOption<T>[]
    /** 選單出現在按鈕的哪一側，空間不夠時會自動翻轉 */
    side?: 'top' | 'bottom'
    /** 選單與按鈕的對齊方式 */
    align?: 'start' | 'center' | 'end'
  }>(),
  {
    side: 'bottom',
    align: 'start',
  },
)

const model = defineModel<T>({ required: true })

defineSlots<{
  /** 觸發選單的按鈕，樣式由使用的元件自己決定 */
  default(): unknown
}>()

const open = ref(false)
</script>

<template>
  <SelectRoot v-model="model" v-model:open="open">
    <SelectTrigger as-child>
      <slot />
    </SelectTrigger>

    <SelectPortal>
      <!-- Esc 只關選單，不要連彈窗一起關掉 -->
      <SelectContent
        class="select-menu"
        position="popper"
        :side="side"
        :align="align"
        :side-offset="6"
        :collision-padding="8"
        @keydown.esc.stop="open = false"
      >
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="String(option.value)"
            :value="option.value"
            class="select-menu__option"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style lang="scss" src="@/scss/SelectMenu.scss"></style>
