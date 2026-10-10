<script setup lang="ts">
import BarCanvas from '@/component/BarCanvas.vue'
import type { BarState } from '@/types/sort'
import { padNumber } from '@/utils/format'

withDefaults(
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
</script>

<template>
  <div class="bar-chart">
    <div class="bar-chart__header">
      <span class="bar-chart__title">VISUALIZATION / {{ title }}</span>
      <span class="bar-chart__step">STEP {{ padNumber(currentStep) }} / {{ padNumber(totalSteps) }}</span>
    </div>

    <div class="bar-chart__content">
      <BarCanvas class="bar-chart__bars" :arr="arr" :bar-states="barStates" />
    </div>

    <div class="bar-chart__footer">
      <span class="bar-chart__footer__step">{{ padNumber(currentStep) }}</span>
      <p class="bar-chart__footer__info">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/scss/BarChart.scss"></style>
