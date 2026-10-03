<script setup lang="ts" generic="T extends string | number">
import { computed, useId } from 'vue'
import type { SelectOption } from '@/types/select'

const props = defineProps<{
  /** 卡片上方的小標籤，如 資料筆數 */
  label: string
  options: SelectOption<T>[]
}>()

const model = defineModel<T>({ required: true })

const id = useId()

/** 原生 select 的 value 只能是字串，這裡用索引對應回選項 */
const selectedIndex = computed({
  get: () => props.options.findIndex((option) => option.value === model.value),
  set: (index: number) => {
    const option = props.options[index]
    if (option) model.value = option.value
  },
})

const selectedLabel = computed(() => props.options[selectedIndex.value]?.label ?? '')
</script>

<template>
  <div class="select-field">
    <label class="select-field__label" :for="id">{{ label }}</label>

    <div class="select-field__control">
      <span class="select-field__value">{{ selectedLabel }}</span>
      <svg class="select-field__arrow" viewBox="0 0 12 8" aria-hidden="true">
        <path d="M0 0h12L6 8z" />
      </svg>

      <!-- 透明的原生 select 蓋在整張卡片上，保留鍵盤操作與原生選單 -->
      <select :id="id" v-model.number="selectedIndex" class="select-field__select">
        <option v-for="(option, index) in options" :key="String(option.value)" :value="index">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/scss/SelectField.scss"></style>
