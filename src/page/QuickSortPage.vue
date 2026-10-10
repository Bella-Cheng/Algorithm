<script setup lang="ts">
import ToolHeader from '@/component/ToolHeader.vue'
import ToolLayout from '@/layout/ToolLayout.vue'
import ToolFooter from '@/component/ToolFooter.vue'
import BarChart from '@/component/BarChart.vue'
import InputPanel from '@/component/InputPanel.vue'
import CodePanel from '@/component/CodePanel.vue'
import DataModal from '@/component/DataModal.vue'
import SortDataFields from '@/component/SortDataFields.vue'
import { computed, ref } from 'vue'
import {
  DEFAULT_SORT_SETTINGS,
  SORT_DATA_HINT,
  createUniqueArray,
  type SortDataSettings,
} from '@/algorithms/sortData'
import {
  QUICK_SORT_CODE,
  QUICK_SORT_PHASE_LABEL,
  createQuickSortSteps,
} from '@/algorithms/quickSort'
import { useStepPlayer } from '@/composables/useStepPlayer'
import type { LegendItem } from '@/types/sort'
import { padNumber } from '@/utils/format'

/** 圖例，顏色與 BarChart 的長條狀態一致 */
const LEGENDS: LegendItem[] = [
  { state: 'active', label: '基準值 pivot' },
  { state: 'comparing', label: '比較中' },
  { state: 'less', label: '已定位' },
  { state: 'greater', label: '大於 pivot' },
  { state: 'default', label: '尚未處理' },
]

/** 目前套用中的資料設定 */
const settings = ref<SortDataSettings>({ ...DEFAULT_SORT_SETTINGS })

/** 原始輸入陣列（頁面載入時先產生一次） */
const arr = ref<number[]>(createUniqueArray(settings.value))

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
  () => `${QUICK_SORT_PHASE_LABEL[step.value.phase]}  /  ${padNumber(step.value.pass)}`,
)

const isModalOpen = ref(false)
/** 彈窗裡正在編輯的設定，按下「產生並套用」才會寫回 settings */
const draft = ref<SortDataSettings>({ ...settings.value })

function openModal() {
  draft.value = { ...settings.value }
  isModalOpen.value = true
}

/** 套用彈窗設定、重新產生陣列，並把步驟歸 0 */
function regenerate() {
  reset()
  settings.value = { ...draft.value }
  arr.value = createUniqueArray(settings.value)
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

    <ToolLayout @regenerate="openModal">
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
      description="設定資料範圍後套用至快速排序。"
      :hint="SORT_DATA_HINT"
      @confirm="regenerate"
    >
      <SortDataFields v-model="draft" />
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
