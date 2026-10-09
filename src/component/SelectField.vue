<script setup lang="ts" generic="T extends string | number">
import { computed } from 'vue'
import SelectMenu from '@/component/SelectMenu.vue'
import type { SelectOption } from '@/types/select'

const props = defineProps<{
  /** 卡片上方的小標籤，如 資料筆數 */
  label: string
  options: SelectOption<T>[]
}>()

const model = defineModel<T>({ required: true })

const selectedLabel = computed(
  () => props.options.find((option) => option.value === model.value)?.label ?? '',
)
</script>

<template>
  <SelectMenu v-model="model" :options="options">
    <!-- 整張卡片就是觸發按鈕 -->
    <button type="button" class="select-field" :aria-label="`${label} ${selectedLabel}`">
      <span class="select-field__label">{{ label }}</span>

      <span class="select-field__control">
        <span class="select-field__value">{{ selectedLabel }}</span>
        <svg class="select-field__arrow" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M0 0h12L6 8z" />
        </svg>
      </span>
    </button>
  </SelectMenu>
</template>

<style scoped lang="scss" src="@/scss/SelectField.scss"></style>
