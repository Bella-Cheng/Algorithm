<script setup lang="ts">
import ToolHeader from '@/component/ToolHeader.vue'
import ToolLayout from '@/layout/ToolLayout.vue'
import ToolFooter from '@/component/ToolFooter.vue'
import GraphChart from '@/component/GraphChart.vue'
import InputPanel from '@/component/InputPanel.vue'
import CodePanel from '@/component/CodePanel.vue'
import { computed, ref } from 'vue'
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
          @regenerate="regenerate"
        />
      </template>

      <template #default>
        <GraphChart
          title="WEIGHTED GRAPH"
          :graph="graph"
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
          language="TYPESCRIPT"
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
