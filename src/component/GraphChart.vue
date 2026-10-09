<script setup lang="ts">
import GraphCanvas from '@/component/GraphCanvas.vue'
import type { EdgeState, Graph, NodeState } from '@/types/graph'

withDefaults(
  defineProps<{
    graph: Graph
    nodeStates?: Record<string, NodeState>
    /** 正在被檢查的鄰居，疊一圈 amber 外框 */
    checkingNode?: string | null
    /** key 為 edgeKey(from, to) */
    edgeStates?: Record<string, EdgeState>
    /** 標題列右側的名稱，如 WEIGHTED GRAPH */
    title?: string
    visitedCount?: number
    currentStep?: number
    /** 下方說明框的文字 */
    message?: string
  }>(),
  {
    nodeStates: () => ({}),
    checkingNode: null,
    edgeStates: () => ({}),
    title: 'GRAPH',
    visitedCount: 0,
    currentStep: 0,
    message: '',
  },
)

function pad(value: number) {
  return String(value).padStart(2, '0')
}
</script>

<template>
  <div class="graph-chart">
    <div class="graph-chart__header">
      <span class="graph-chart__title">VISUALIZATION / {{ title }}</span>
      <span class="graph-chart__visited">
        VISITED {{ pad(visitedCount) }} / {{ pad(graph.nodes.length) }}
      </span>
    </div>

    <div class="graph-chart__content">
      <GraphCanvas
        :graph="graph"
        :node-states="nodeStates"
        :checking-node="checkingNode"
        :edge-states="edgeStates"
      />
    </div>

    <div class="graph-chart__footer">
      <span class="graph-chart__footer__step">{{ pad(currentStep) }}</span>
      <p class="graph-chart__footer__info">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/scss/GraphChart.scss"></style>
