<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AlgorithmCard from '@/component/AlgorithmCard.vue'
import BarCanvas from '@/component/BarCanvas.vue'
import GraphCanvas from '@/component/GraphCanvas.vue'
import SiteFooter from '@/component/SiteFooter.vue'
import { createBubbleSortSteps } from '@/algorithms/bubbleSort'
import {
  DEFAULT_END,
  DEFAULT_START,
  DIJKSTRA_DATA,
  NODE_POSITIONS,
  createDijkstraSteps,
  toEdges,
} from '@/algorithms/dijkstra'
import type { Graph } from '@/types/graph'
import type { BarState } from '@/types/sort'

// ---------------------------------------------------------------------------
// Hero：自動循環播放的氣泡排序
// ---------------------------------------------------------------------------

const HERO_DATA = [42, 78, 34, 92, 56, 68, 48, 84, 61]
/** 每一步停留的毫秒數 */
const HERO_INTERVAL = 900
/** 排序完成後停留多久再重新開始 */
const HERO_REST = 2400

const heroSteps = createBubbleSortSteps(HERO_DATA)
const heroIndex = ref(0)
const heroStep = computed(() => heroSteps[heroIndex.value]!)
const heroDone = computed(() => heroStep.value.phase === 'done')
/** 說明文字只取一行 */
const heroCaption = computed(() => heroStep.value.summary.replace(/\n/g, ' '))

let heroTimer: ReturnType<typeof setTimeout> | undefined

function tickHero() {
  heroTimer = setTimeout(
    () => {
      heroIndex.value = heroDone.value ? 0 : heroIndex.value + 1
      tickHero()
    },
    heroDone.value ? HERO_REST : HERO_INTERVAL,
  )
}

onMounted(tickHero)
onBeforeUnmount(() => clearTimeout(heroTimer))

// ---------------------------------------------------------------------------
// Dijkstra 卡片：和工作台同一張圖，顯示最後找出的最短路徑
// ---------------------------------------------------------------------------

const graph: Graph = { nodes: NODE_POSITIONS, edges: toEdges(DIJKSTRA_DATA) }
const dijkstraResult = createDijkstraSteps(DIJKSTRA_DATA, DEFAULT_START, DEFAULT_END).at(-1)!

// ---------------------------------------------------------------------------
// 排序卡片：由矮到高的長條，第 6 根用該演算法的狀態色
// ---------------------------------------------------------------------------

const PREVIEW_BARS = [14, 20, 26, 32, 38, 44, 50, 56]
const previewStates = (state: BarState) =>
  PREVIEW_BARS.map<BarState>((_, i) => (i === 5 ? state : 'default'))
/** 氣泡排序：lime 代表正在往右冒泡的值 */
const bubblePreview = previewStates('active')
/** 快速排序：cyan 代表已固定位置的 pivot */
const quickPreview = previewStates('sorted')
</script>

<template>
  <div class="home">
    <section class="home__hero">
      <div class="home__intro">
        <span class="home__eyebrow">ALGORITHM STUDIO / 001</span>
        <h1 class="home__headline">看懂每一次<br />交換與選擇。</h1>
        <p class="home__lead">把抽象的演算法，轉化成可暫停、可拆解、可親手操控的視覺體驗。</p>
        <div class="home__actions">
          <RouterLink to="/BubbleSort" class="home__btn home__btn--primary">進入工作台</RouterLink>
          <!-- 原生錨點：瀏覽器會自己捲動 .main-layout__content 到卡片區 -->
          <a href="#modules" class="home__btn">了解方法</a>
        </div>
      </div>

      <div class="home__live">
        <div class="home__live-header">
          <span>BUBBLE SORT / LIVE</span>
          <span class="home__live-status" :class="{ 'home__live-status--done': heroDone }">
            {{ heroDone ? 'SORTED' : 'RUNNING' }}
          </span>
        </div>

        <div class="home__live-bars">
          <BarCanvas :arr="heroStep.arr" :bar-states="heroStep.barStates" :show-index="false" />
        </div>

        <p class="home__live-caption">{{ heroCaption }}</p>
      </div>
    </section>

    <section id="modules" class="home__modules">
      <div class="home__modules-header">
        <h2 class="home__modules-title">選一個演算法，開始拆解</h2>
        <span class="home__modules-count">03 MODULES</span>
      </div>

      <div class="home__cards">
        <AlgorithmCard
          index="01"
          title="氣泡排序"
          description="兩兩比較，讓最大值逐步浮出。"
          complexity="O(n²)"
          to="/BubbleSort"
          accent="lime"
        >
          <template #preview>
            <BarCanvas class="home__mini-bars" :arr="PREVIEW_BARS" :bar-states="bubblePreview" compact />
          </template>
        </AlgorithmCard>
        <AlgorithmCard
          index="02"
          title="快速排序"
          description="選定基準，將問題俐落地分割。"
          complexity="O(n log n)"
          to="/QuickSort"
          accent="cyan"
        >
          <template #preview>
            <BarCanvas class="home__mini-bars" :arr="PREVIEW_BARS" :bar-states="quickPreview" compact />
          </template>
        </AlgorithmCard>
        <AlgorithmCard
          index="03"
          title="Dijkstra 最短路徑"
          description="從起點擴張，找出最小成本路徑。"
          complexity="O(E log V)"
          to="/Dijkstra"
          accent="amber"
        >
          <template #preview>
            <GraphCanvas
              class="home__graph"
              :graph="graph"
              :node-states="dijkstraResult.nodeStates"
              :edge-states="dijkstraResult.edgeStates"
              compact
            />
          </template>
        </AlgorithmCard>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped lang="scss" src="@/scss/HomePage.scss"></style>
