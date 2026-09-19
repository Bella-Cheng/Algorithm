<script setup lang="ts">
import ToolHeader from '@/component/ToolHeader.vue'
import ToolLayout from '@/layout/ToolLayout.vue'
import ToolFooter from '@/component/ToolFooter.vue'
import BarChart from '@/component/BarChart.vue'
import InputPanel from '@/component/InputPanel.vue'
import CodePanel from '@/component/CodePanel.vue'
import { computed, ref } from 'vue'
import {
  BUBBLE_SORT_CODE,
  BUBBLE_SORT_PHASE_LABEL,
  createBubbleSortSteps,
} from '@/algorithms/bubbleSort'
import { useStepPlayer } from '@/composables/useStepPlayer'

/** 隨機陣列的數量與範圍 */
const ARRAY_LENGTH = 8
const MIN_VALUE = 1
const MAX_VALUE = 100

const randomArray = (length: number, min: number, max: number) => {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min)
}

/** 原始輸入陣列（頁面載入時先產生一次） */
const arr = ref<number[]>(randomArray(ARRAY_LENGTH, MIN_VALUE, MAX_VALUE))

/** 依輸入陣列預先算出所有步驟，並記錄排序耗時 */
const sortResult = computed(() => {
  const start = performance.now()
  const steps = createBubbleSortSteps(arr.value)
  return { steps, duration: performance.now() - start }
})

const steps = computed(() => sortResult.value.steps)
/** 最後一步的索引（第 0 步為初始狀態） */
const lastStep = computed(() => steps.value.length - 1)

const { currentStep, isPlaying, speed, togglePlay, next, prev, reset, setSpeed } =
  useStepPlayer(lastStep)

/** 目前顯示的步驟快照 */
const step = computed(() => steps.value[currentStep.value] ?? steps.value[0]!)

const stepLabel = computed(
  () => `${BUBBLE_SORT_PHASE_LABEL[step.value.phase]}  /  ${String(step.value.pass).padStart(2, '0')}`,
)

/** 重新產生陣列，並把步驟歸 0 TODO: 之後再來接彈窗，可以讓使用者自訂 */
function regenerate() {
  reset()
  arr.value = randomArray(ARRAY_LENGTH, MIN_VALUE, MAX_VALUE)
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
        <InputPanel
          :arr="arr"
          :step-label="stepLabel"
          :step-text="step.summary"
          @regenerate="regenerate"
        />
      </template>

      <template #default>
        <BarChart
          title="BUBBLE SORT"
          :arr="step.arr"
          :bar-states="step.barStates"
          :current-step="currentStep"
          :total-steps="lastStep"
          :message="step.detail"
        />
      </template>

      <template #right>
        <CodePanel
          file-name="bubbleSort.ts"
          language="TYPESCRIPT"
          :lines="BUBBLE_SORT_CODE"
          :highlight-lines="step.highlightLines"
          :status-label="BUBBLE_SORT_PHASE_LABEL[step.phase]"
          :status-meta="`${sortResult.duration.toFixed(2)} ms`"
        />
      </template>

      <template #footer>
        <ToolFooter
          :current-step="currentStep"
          :total-steps="lastStep"
          :is-playing="isPlaying"
          :active-speed="speed"
          @reset="reset"
          @prev="prev"
          @next="next"
          @toggle-play="togglePlay"
          @change-speed="setSpeed"
        />
      </template>
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
