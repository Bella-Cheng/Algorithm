<script setup lang="ts">
import ToolHeader from '@/component/ToolHeader.vue'
import ToolLayout from '@/layout/ToolLayout.vue'
import BarChart from '@/component/BarChart.vue';
import { ref } from 'vue'

/** 隨機陣列的數量與範圍 */
const ARRAY_LENGTH = 8
const MIN_VALUE = 1
const MAX_VALUE = 100

const randomArray = (length: number, min: number, max: number) => {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min)
}

/** 目前排序的陣列（頁面載入時先產生一次） */
const arr = ref<number[]>(randomArray(ARRAY_LENGTH, MIN_VALUE, MAX_VALUE))

/** 目前步驟 */
const currentStep = ref(0)

/** 重新產生陣列，並把步驟歸 0 */
function regenerate() {
  arr.value = randomArray(ARRAY_LENGTH, MIN_VALUE, MAX_VALUE)
  currentStep.value = 0
}
</script>

<template>
  <div class="bubble-sort-page">
    <ToolHeader
      index="01"
      title-zh="氣泡排序"
      title-en="BUBBLE SORT"
      time="O(n²)"
      space="O(1)"
      status-label="STABLE"
      status-value="YES"
      status-variant="primary"
    />

    <ToolLayout>
      <template #left>
        <button type="button" @click="regenerate">重新產生</button>
      </template>
      <template #default>
        <BarChart :arr="arr" :current-step="currentStep" />
      </template>
      <template #right></template>
    </ToolLayout>
  </div>
</template>

<style scoped>
.bubble-sort-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
</style>
