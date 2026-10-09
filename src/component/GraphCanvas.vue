<script setup lang="ts">
import { computed } from 'vue'
import { edgeKey } from '@/types/graph'
import type { EdgeState, Graph, NodeState } from '@/types/graph'

const props = withDefaults(
  defineProps<{
    graph: Graph
    nodeStates?: Record<string, NodeState>
    /** 正在被檢查的鄰居，疊一圈 amber 外框 */
    checkingNode?: string | null
    /** key 為 edgeKey(from, to) */
    edgeStates?: Record<string, EdgeState>
    /** 精簡模式：隱藏節點名稱與權重，給首頁卡片等小尺寸預覽用 */
    compact?: boolean
  }>(),
  {
    nodeStates: () => ({}),
    checkingNode: null,
    edgeStates: () => ({}),
    compact: false,
  },
)

/** 節點半徑，viewBox 固定 820 × 520 */
const NODE_RADIUS = 34
/** 權重標籤離邊的距離 */
const LABEL_OFFSET = 14

/** 預先算好每條邊的端點與權重標籤位置 */
const edges = computed(() => {
  const position = new Map(props.graph.nodes.map((node) => [node.id, node]))

  return props.graph.edges.flatMap((edge) => {
    const from = position.get(edge.from)
    const to = position.get(edge.to)
    if (!from || !to) return []

    const dx = to.x - from.x
    const dy = to.y - from.y
    const length = Math.hypot(dx, dy) || 1
    // 法向量統一朝上方，標籤才不會一條在上、一條在下
    const flip = dx < 0 ? -1 : 1
    const nx = (dy / length) * flip
    const ny = (-dx / length) * flip

    const key = edgeKey(edge.from, edge.to)
    return [
      {
        key,
        weight: edge.weight,
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        labelX: (from.x + to.x) / 2 + nx * LABEL_OFFSET,
        labelY: (from.y + to.y) / 2 + ny * LABEL_OFFSET,
      },
    ]
  })
})

/** 有顏色的邊（path / checking）畫在最上層，避免被灰色的邊蓋住 */
const sortedEdges = computed(() => {
  const isHighlighted = (key: string) => Number((props.edgeStates[key] ?? 'default') !== 'default')
  return [...edges.value].sort((a, b) => isHighlighted(a.key) - isHighlighted(b.key))
})
</script>

<template>
  <svg
    class="graph-canvas"
    :class="{ 'graph-canvas--compact': compact }"
    viewBox="0 0 820 520"
    role="img"
    aria-label="加權圖"
  >
    <g
      v-for="edge in sortedEdges"
      :key="edge.key"
      class="graph-canvas__edge"
      :class="`graph-canvas__edge--${edgeStates[edge.key] ?? 'default'}`"
    >
      <line :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2" />
      <text v-if="!compact" :x="edge.labelX" :y="edge.labelY" class="graph-canvas__weight">
        {{ edge.weight }}
      </text>
    </g>

    <g
      v-for="node in graph.nodes"
      :key="node.id"
      class="graph-canvas__node"
      :class="[
        `graph-canvas__node--${nodeStates[node.id] ?? 'default'}`,
        { 'graph-canvas__node--checking': node.id === checkingNode },
      ]"
    >
      <circle :cx="node.x" :cy="node.y" :r="NODE_RADIUS" />
      <text v-if="!compact" :x="node.x" :y="node.y" class="graph-canvas__node-label">
        {{ node.id }}
      </text>
    </g>
  </svg>
</template>

<style scoped lang="scss" src="@/scss/GraphCanvas.scss"></style>
