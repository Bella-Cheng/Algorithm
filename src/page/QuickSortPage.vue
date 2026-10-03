<script setup lang="ts">
import ToolHeader from '@/component/ToolHeader.vue'
import ToolLayout from '@/layout/ToolLayout.vue'
import ToolFooter from '@/component/ToolFooter.vue'
import BarChart from '@/component/BarChart.vue'
import InputPanel from '@/component/InputPanel.vue'
import CodePanel from '@/component/CodePanel.vue'
import DataModal from '@/component/DataModal.vue'
import SelectField from '@/component/SelectField.vue'
import SortDataFields from '@/component/SortDataFields.vue'
import { computed, ref } from 'vue'
import {
  DEFAULT_SORT_SETTINGS,
  SORT_DATA_HINT,
  type SortDataSettings,
} from '@/algorithms/sortData'
import type { SelectOption } from '@/types/select'
import {
  QUICK_SORT_CODE,
  QUICK_SORT_PHASE_LABEL,
  createQuickSortSteps,
} from '@/algorithms/quickSort'
import { useStepPlayer } from '@/composables/useStepPlayer'
import type { LegendItem } from '@/types/sort'

/** 隨機陣列的數量與範圍 */
const ARRAY_LENGTH = 8
const MIN_VALUE = 1
const MAX_VALUE = 100

/** 圖例，顏色與 BarChart 的長條狀態一致 */
const LEGENDS: LegendItem[] = [
  { state: 'active', label: '基準值 pivot' },
  { state: 'comparing', label: '比較中' },
  { state: 'less', label: '小於 pivot・已定位' },
  { state: 'greater', label: '大於 pivot' },
  { state: 'default', label: '尚未處理' },
]

const randomArray = (length: number, min: number, max: number) => {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min)
}

/** 原始輸入陣列（頁面載入時先產生一次） */
const arr = ref<number[]>(randomArray(ARRAY_LENGTH, MIN_VALUE, MAX_VALUE))

/** 依輸入陣列預先算出所有步驟，並記錄排序耗時 */
const sortResult = computed(() => {
  const start = performance.now()
  const steps = createQuickSortSteps(arr.value)
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
  () => `${QUICK_SORT_PHASE_LABEL[step.value.phase]}  /  ${String(step.value.pass).padStart(2, '0')}`,
)

type PivotStrategy = 'right' | 'left' | 'middle' | 'random'

/** 選擇基準值的選項 */
const PIVOT_OPTIONS: SelectOption<PivotStrategy>[] = [
  { label: '最右邊', value: 'right' },
  { label: '最左邊', value: 'left' },
  { label: '中間', value: 'middle' },
  { label: '隨機', value: 'random' },
]

const isModalOpen = ref(false)
/** 彈窗裡正在編輯的設定 TODO: 之後接上 regenerate 與 createQuickSortSteps */
const draft = ref<SortDataSettings>({ ...DEFAULT_SORT_SETTINGS })
const pivotDraft = ref<PivotStrategy>('right')

function openModal() {
  isModalOpen.value = true
}

/** 重新產生陣列，並把步驟歸 0 */
function regenerate() {
  reset()
  arr.value = randomArray(ARRAY_LENGTH, MIN_VALUE, MAX_VALUE)
}
</script>

<template>
  <div class="quick-sort-page">
    <ToolHeader
      index="02"
      title-zh="快速排序"
      title-en="QUICK SORT"
      time="O(n log n)"
      space="O(log n)"
      status-label="STABLE"
      status-value="NO"
      status-variant="comparing"
    />

    <ToolLayout>
      <template #left>
        <InputPanel
          :arr="arr"
          :step-label="stepLabel"
          :step-text="step.summary"
          :legends="LEGENDS"
          @regenerate="openModal"
        />
      </template>

      <template #default>
        <BarChart
          title="PARTITION"
          :arr="step.arr"
          :bar-states="step.barStates"
          :current-step="currentStep"
          :total-steps="lastStep"
          :message="step.detail"
        />
      </template>

      <template #right>
        <CodePanel
          file-name="quickSort.ts"
          language="TYPESCRIPT"
          :lines="QUICK_SORT_CODE"
          :highlight-lines="step.highlightLines"
          :status-label="QUICK_SORT_PHASE_LABEL[step.phase]"
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

    <DataModal
      v-model:open="isModalOpen"
      description="設定資料範圍與基準值後套用至快速排序。"
      extra-title="PIVOT"
      :hint="SORT_DATA_HINT"
      @confirm="regenerate"
    >
      <SortDataFields v-model="draft" />

      <template #extra>
        <SelectField v-model="pivotDraft" label="選擇基準值" :options="PIVOT_OPTIONS" />
      </template>
    </DataModal>
  </div>
</template>

<style scoped>
.quick-sort-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
</style>
