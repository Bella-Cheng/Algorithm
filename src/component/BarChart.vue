<script setup lang="ts">
import { computed } from 'vue'
import type { BarState } from '@/types/sort'

const props = withDefaults(
  defineProps<{
    /** 要顯示的數字陣列 */
    arr?: number[]
    /** 每根長條的狀態，與 arr 一一對應 */
    barStates?: BarState[]
    /** 標題列右側的名稱，如 BUBBLE SORT */
    title?: string
    currentStep?: number
    totalSteps?: number
    /** 下方說明框的文字 */
    message?: string
  }>(),
  {
    arr: () => [],
    barStates: () => [],
    title: 'BAR CHART',
    currentStep: 0,
    totalSteps: 0,
    message: '',
  },
)

/** 陣列最大值（空陣列時為 0） */
const maxValue = computed(() => (props.arr.length ? Math.max(...props.arr) : 0))

/** 計算柱子高度百分比（最大值為 0 時回傳 0%，避免除以 0） */
function getBarHeight(value: number) {
  if (maxValue.value === 0) return '0%'
  return `${(value / maxValue.value) * 100}%`
}

function padStep(step: number) {
  return String(step).padStart(2, '0')
}
</script>

<template>
  <div class="bar-chart">
    <div class="bar-chart__header">
      <span class="bar-chart__title">VISUALIZATION / {{ title }}</span>
      <span class="bar-chart__step">STEP {{ padStep(currentStep) }} / {{ padStep(totalSteps) }}</span>
    </div>

    <div class="bar-chart__content">
      <div class="bar-chart__bars">
        <div
          v-for="(value, index) in arr"
          :key="index"
          class="bar-chart__bar"
          :class="`bar-chart__bar--${barStates[index] ?? 'default'}`"
          :style="{ height: getBarHeight(value) }"
        >
          <span class="bar-chart__bar__label">{{ value }}</span>
          <span class="bar-chart__bar__index">[{{ index }}]</span>
        </div>
      </div>
    </div>

    <div class="bar-chart__footer">
      <span class="bar-chart__footer__step">{{ padStep(currentStep) }}</span>
      <p class="bar-chart__footer__info">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/scss/BarChart.scss"></style>
