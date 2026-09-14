<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 要顯示的數字陣列 */
    arr?: number[]
    currentStep?: number
    totalSteps?: number
  }>(),
  {
    arr: () => [],
    currentStep: 0,
    totalSteps: 0,
  },
)

/** 陣列最大值（空陣列時為 0） */
const maxValue = computed(() => (props.arr.length ? Math.max(...props.arr) : 0))

/** 計算柱子高度百分比（最大值為 0 時回傳 0%，避免除以 0） */
function getBarHeight(value: number) {
  if (maxValue.value === 0) return '0%'
  return `${(value / maxValue.value) * 100}%`
}

// function bubbleSort(arr: number[]) {

//   if (arr.length == 0) return

//   let temp = 0;

//   for (let j = arr.length; j > 1; j--) {

//     for (let i = 0; i < j - 1; i++) {
//       if (arr[i] > arr[i + 1]) {
//         temp = arr[i];
//         arr[i] = arr[i + 1];
//         arr[i + 1] = temp;
//       }
//     }
//   }
// }

</script>

<template>
  <div class="bar-chart">
    <div class="bar-chart__header">
      <span>VISUALIZATION / BAR CHART</span>
      <span>STEP {{ currentStep }} / {{ totalSteps }}</span>
    </div>

    <div class="bar-chart__content">
      <div class="bar-chart__bars">
        <div
          v-for="(value, index) in arr"
          :key="index"
          class="bar-chart__bar"
          :style="{ height: getBarHeight(value) }"
        >
          <span class="bar-chart__bar__label">{{ value }}</span>
          <span class="bar-chart__bar__index">[{{ index }}]</span>
        </div>
      </div>
    </div>

    <div class="bar-chart__footer">
      <span></span>
      <div class="bar-chart__footer__info"></div>
    </div>
  </div>


</template>

<style scoped lang="scss" src="@/scss/BarChart.scss"></style>