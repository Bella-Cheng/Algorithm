<script setup lang="ts" generic="T extends string | number">
import { ref } from 'vue'
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import type { SelectOption } from '@/types/select'

defineProps<{
  /** 卡片上方的小標籤，如 資料筆數 */
  label: string
  options: SelectOption<T>[]
}>()

const model = defineModel<T>({ required: true })

const open = ref(false)
</script>

<template>
  <SelectRoot v-model="model" v-model:open="open">
    <SelectTrigger class="select-field" :aria-label="label">
      <span class="select-field__label">{{ label }}</span>

      <span class="select-field__control">
        <SelectValue class="select-field__value" />
        <svg class="select-field__arrow" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M0 0h12L6 8z" />
        </svg>
      </span>
    </SelectTrigger>

    <SelectPortal>
      <!-- 選單樣式比照 ToolFooter 的速度選單；Esc 只關選單，不要連彈窗一起關掉 -->
      <SelectContent
        class="select-field__menu"
        position="popper"
        :side-offset="6"
        :collision-padding="8"
        @keydown.esc.stop="open = false"
      >
        <SelectViewport class="select-field__viewport">
          <SelectLabel class="select-field__sr-only">{{ label }}</SelectLabel>
          <SelectItem
            v-for="option in options"
            :key="String(option.value)"
            :value="option.value"
            class="select-field__option"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style scoped lang="scss" src="@/scss/SelectField.scss"></style>
<style lang="scss" src="@/scss/SelectFieldMenu.scss"></style>
