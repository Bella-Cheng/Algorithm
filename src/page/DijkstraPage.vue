<script setup lang="ts">
import ToolHeader from '@/component/ToolHeader.vue'
import ToolLayout from '@/layout/ToolLayout.vue'
import ToolFooter from '@/component/ToolFooter.vue'
import GraphChart from '@/component/GraphChart.vue'
import InputPanel from '@/component/InputPanel.vue'
import CodePanel from '@/component/CodePanel.vue'
import DataModal from '@/component/DataModal.vue'
import SelectField from '@/component/SelectField.vue'
import { computed, ref, watch } from 'vue'
import type { SelectOption } from '@/types/select'
import {
  DEFAULT_END,
  DEFAULT_START,
  DIJKSTRA_CODE,
  DIJKSTRA_DATA,
  DIJKSTRA_PHASE_LABEL,
  NODE_POSITIONS,
  createDijkstraSteps,
  createRandomData,
  toEdges,
} from '@/algorithms/dijkstra'
import { useStepPlayer } from '@/composables/useStepPlayer'
import type { Graph } from '@/types/graph'
import type { LegendItem } from '@/types/sort'

/** 圖例，顏色與 GraphChart 的節點狀態一致 */
const LEGENDS: LegendItem[] = [
  { state: 'current', label: '目前節點' },
  { state: 'checking', label: '檢查中的鄰居' },
  { state: 'queued', label: '等待中（queue）' },
  { state: 'visited', label: '已確認' },
  { state: 'path', label: '最短路徑' },
]

/** 鄰接表，頁面載入時先用設計稿上的圖 */
const data = ref(DIJKSTRA_DATA)

/** 畫面用的圖：節點座標 + 從鄰接表整理出的不重複邊 */
const graph = computed<Graph>(() => ({ nodes: NODE_POSITIONS, edges: toEdges(data.value) }))

const graphInfo = computed(
  () =>
    `${DEFAULT_START} → ${DEFAULT_END}  /  ${graph.value.nodes.length} nodes · ${graph.value.edges.length} edges`,
)

/** 依圖預先算出所有步驟，並記錄耗時 */
const result = computed(() => {
  const start = performance.now()
  const steps = createDijkstraSteps(data.value, DEFAULT_START, DEFAULT_END)
  return { steps, duration: performance.now() - start }
})

const steps = computed(() => result.value.steps)
/** 最後一步的索引（第 0 步為初始狀態） */
const lastStep = computed(() => steps.value.length - 1)

const { currentStep, isPlaying, speed, togglePlay, next, prev, reset, setSpeed } =
  useStepPlayer(lastStep)

/** 目前顯示的步驟快照 */
const step = computed(() => steps.value[currentStep.value] ?? steps.value[0]!)

const stepLabel = computed(
  () =>
    `${DIJKSTRA_PHASE_LABEL[step.value.phase]}  ${step.value.focus}  /  ${String(step.value.visitedCount).padStart(2, '0')}`,
)

/** 節點數量選項：4–10 個 */
const NODE_COUNT_OPTIONS: SelectOption<number>[] = Array.from({ length: 7 }, (_, index) => ({
  label: String(index + 4),
  value: index + 4,
}))

const isModalOpen = ref(false)
/** 彈窗裡正在編輯的設定 TODO: 之後接上 regenerate，依節點數產生新的圖 */
const draft = ref({ count: graph.value.nodes.length, start: DEFAULT_START, end: DEFAULT_END })

/** 節點依序命名為 A、B、C…，選項跟著節點數量變動 */
const nodeOptions = computed<SelectOption<string>[]>(() =>
  Array.from({ length: draft.value.count }, (_, index) => {
    const id = String.fromCharCode(65 + index)
    return { label: id, value: id }
  }),
)
/** 終點不能和起點相同 */
const endOptions = computed(() => nodeOptions.value.filter((option) => option.value !== draft.value.start))

// 節點數變少或起點改成終點時，把超出範圍的起點/終點修正回來
watch(
  [nodeOptions, () => draft.value.start],
  () => {
    const ids = nodeOptions.value.map((option) => option.value)
    if (!ids.includes(draft.value.start)) draft.value.start = ids[0]!
    if (!endOptions.value.some((option) => option.value === draft.value.end)) {
      draft.value.end = endOptions.value.at(-1)!.value
    }
  },
)

function openModal() {
  isModalOpen.value = true
}

/** 重新產生邊的權重，並把步驟歸 0 */
function regenerate() {
  reset()
  data.value = createRandomData()
}
</script>

<template>
  <div class="dijkstra-page">
    <ToolHeader
      index="03"
      title-zh="Dijkstra 最短路徑"
      title-en="SHORTEST PATH"
      time="O(E log V)"
      space="O(V)"
      status-label="WEIGHT"
      status-value="≥ 0"
      status-variant="primary"
    />

    <ToolLayout>
      <template #left>
        <InputPanel
          title="GRAPH DATA"
          data-label="起點 → 終點 / 節點"
          :data-text="graphInfo"
          :step-label="stepLabel"
          :step-text="step.summary"
          :legends="LEGENDS"
          @regenerate="openModal"
        />
      </template>

      <template #default>
        <GraphChart
          title="WEIGHTED GRAPH"
          :graph="graph"
          :dist="step.dist"
          :node-states="step.nodeStates"
          :checking-node="step.checkingNode"
          :edge-states="step.edgeStates"
          :visited-count="step.visitedCount"
          :current-step="currentStep"
          :message="step.detail"
        />
      </template>

      <template #right>
        <CodePanel
          file-name="dijkstra.js"
          language="JAVASCRIPT"
          :lines="DIJKSTRA_CODE"
          :highlight-lines="step.highlightLines"
          :status-label="`${DIJKSTRA_PHASE_LABEL[step.phase]} ${step.focus}`"
          :status-meta="`${result.duration.toFixed(2)} ms`"
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
      description="設定節點數量與起訖點後套用至 Dijkstra 最短路徑。"
      settings-title="GRAPH SETTINGS"
      hint="建議 4–10 個節點；邊的權重會隨機產生 1–9。"
      @confirm="regenerate"
    >
      <SelectField v-model="draft.count" label="節點數量" :options="NODE_COUNT_OPTIONS" />
      <SelectField v-model="draft.start" label="起始 node" :options="nodeOptions" />
      <SelectField v-model="draft.end" label="結束 node" :options="endOptions" />
    </DataModal>
  </div>
</template>

<style scoped>
.dijkstra-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
</style>
