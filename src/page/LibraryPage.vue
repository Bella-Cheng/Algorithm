<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AlgorithmCard, { type AlgorithmCardAccent } from '@/component/AlgorithmCard.vue'
import BarCanvas from '@/component/BarCanvas.vue'
import GraphCanvas from '@/component/GraphCanvas.vue'
import SiteFooter from '@/component/SiteFooter.vue'
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
// 模組資料
// ---------------------------------------------------------------------------

type Category = 'sorting' | 'graph'
type Level = 'basic' | 'advanced'

interface LibraryModule {
  index: string
  title: string
  description: string
  complexity: string
  to: string
  accent: AlgorithmCardAccent
  category: Category
  level: Level
  /** 搜尋用的額外關鍵字（英文名、別名等） */
  keywords: string[]
  /** 排序卡片預覽長條的強調狀態；圖論卡片不用 */
  previewState?: BarState
}

const MODULES: LibraryModule[] = [
  {
    index: '01',
    title: '氣泡排序',
    description: '兩兩比較，讓最大值逐步浮出。',
    complexity: 'O(n²)',
    to: '/BubbleSort',
    accent: 'lime',
    category: 'sorting',
    level: 'basic',
    keywords: ['bubble sort', '交換', 'swap'],
    previewState: 'active',
  },
  {
    index: '02',
    title: '快速排序',
    description: '選定基準，將問題俐落地分割。',
    complexity: 'O(n log n)',
    to: '/QuickSort',
    accent: 'cyan',
    category: 'sorting',
    level: 'advanced',
    keywords: ['quick sort', 'pivot', '基準', '分治', 'divide and conquer'],
    previewState: 'sorted',
  },
  {
    index: '03',
    title: 'Dijkstra 最短路徑',
    description: '從起點擴張，找出最小成本路徑。',
    complexity: 'O(E log V)',
    to: '/Dijkstra',
    accent: 'amber',
    category: 'graph',
    level: 'advanced',
    keywords: ['shortest path', '最短路徑', '圖', 'graph', 'greedy', '貪婪'],
  },
]

/** 篩選按鈕：類別與難度放在同一排，一次只選一個 */
type Filter = 'all' | Category | Level
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'sorting', label: '排序' },
  { value: 'graph', label: '圖論' },
  { value: 'basic', label: '基礎' },
  { value: 'advanced', label: '進階' },
]

const LEARNING_PATH = [
  { index: '01', label: '觀察交換', to: '/BubbleSort', accent: 'lime' },
  { index: '02', label: '理解分割', to: '/QuickSort', accent: 'cyan' },
  { index: '03', label: '探索路徑', to: '/Dijkstra', accent: 'amber' },
] as const

const pad = (n: number) => String(n).padStart(2, '0')

const total = pad(MODULES.length)
const categoryCount = pad(new Set(MODULES.map((m) => m.category)).size)

// ---------------------------------------------------------------------------
// 搜尋與篩選
// ---------------------------------------------------------------------------

const query = ref('')
const activeFilter = ref<Filter>('all')

const filteredModules = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  const filter = activeFilter.value

  return MODULES.filter((m) => {
    /** 符合篩選 (全部、種類、難度) */
    const matchFilter = filter === 'all' || m.category === filter || m.level === filter
    if (!matchFilter) return false //「目前這一個模組」：它不符合篩選，跳過
    if (!keyword) return true //沒輸入關鍵字，就直接保留卡片
    return [m.title, m.description, m.complexity, ...m.keywords].some((text) =>
      text.toLowerCase().includes(keyword),
    )
  })
})

function resetFilters() {
  query.value = ''
  activeFilter.value = 'all'
}

// 按「/」直接聚焦搜尋框（輸入框內打字時不攔截）
const searchInput = ref<HTMLInputElement>()

function onKeydown(event: KeyboardEvent) {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
  event.preventDefault()
  searchInput.value?.focus()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

// ---------------------------------------------------------------------------
// 卡片預覽：與首頁相同
// ---------------------------------------------------------------------------

const PREVIEW_BARS = [14, 20, 26, 32, 38, 44, 50, 56]
const previewStates = (state: BarState) =>
  PREVIEW_BARS.map<BarState>((_, i) => (i === 5 ? state : 'default'))

const graph: Graph = { nodes: NODE_POSITIONS, edges: toEdges(DIJKSTRA_DATA) }
const dijkstraResult = createDijkstraSteps(DIJKSTRA_DATA, DEFAULT_START, DEFAULT_END).at(-1)!
</script>

<template>
  <div class="library">
    <section class="library__hero">
      <div class="library__intro">
        <span class="library__eyebrow">
          ALGORITHM LIBRARY <span class="library__sep">/</span> {{ total }} MODULES
        </span>
        <h1 class="library__headline">演算法庫</h1>
        <p class="library__lead">依照資料結構、複雜度與學習目標，選擇下一個要拆解的演算法。</p>
      </div>

      <div class="library__status">
        <span class="library__status-label">LIBRARY STATUS</span>
        <dl class="library__stats">
          <div class="library__stat library__stat--lime">
            <dt>可操作</dt>
            <dd>{{ total }}</dd>
          </div>
          <div class="library__stat library__stat--cyan">
            <dt>類別</dt>
            <dd>{{ categoryCount }}</dd>
          </div>
          <div class="library__stat library__stat--amber">
            <dt>互動視覺</dt>
            <dd>100%</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="library__toolbar">
      <div class="library__search-row">
        <label class="library__search">
          <span class="library__search-key" aria-hidden="true">/</span>
          <input
            ref="searchInput"
            v-model="query"
            type="search"
            class="library__search-input"
            placeholder="搜尋演算法、關鍵字或複雜度⋯"
            aria-label="搜尋演算法"
          />
        </label>
        <span class="library__result-count">
          顯示 {{ pad(filteredModules.length) }} / {{ total }}
        </span>
      </div>

      <div class="library__filters" role="group" aria-label="篩選演算法">
        <button
          v-for="filter in FILTERS"
          :key="filter.value"
          type="button"
          class="library__filter"
          :class="{ 'library__filter--active': activeFilter === filter.value }"
          :aria-pressed="activeFilter === filter.value"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </section>

    <section class="library__modules">
      <div class="library__modules-header">
        <h2 class="library__modules-title">選擇一個模組，開始拆解</h2>
        <span class="library__note-hint">選擇卡片進入工作台</span>
      </div>

      <template v-if="filteredModules.length">
        <div class="library__cards">
          <AlgorithmCard
            v-for="m in filteredModules"
            :key="m.to"
            :index="m.index"
            :title="m.title"
            :description="m.description"
            :complexity="m.complexity"
            :to="m.to"
            :accent="m.accent"
          >
            <template #preview>
              <BarCanvas
                v-if="m.previewState"
                class="library__mini-bars"
                :arr="PREVIEW_BARS"
                :bar-states="previewStates(m.previewState)"
                compact
              />
              <GraphCanvas
                v-else
                class="library__graph"
                :graph="graph"
                :node-states="dijkstraResult.nodeStates"
                :edge-states="dijkstraResult.edgeStates"
                compact
              />
            </template>
          </AlgorithmCard>
        </div>

        <div class="library__note">
          <p>每個模組都包含可調整資料、逐步播放與程式碼對照。</p>
        </div>
      </template>

      <div v-else class="library__empty">
        <p>找不到符合「{{ query || FILTERS.find((f) => f.value === activeFilter)?.label }}」的模組。</p>
        <button type="button" class="library__empty-reset" @click="resetFilters">清除篩選</button>
      </div>

    </section>

    <section class="library__path">
      <h2 class="library__path-title">建議學習順序</h2>
      <ol class="library__steps">
        <li v-for="step in LEARNING_PATH" :key="step.to">
          <RouterLink :to="step.to" class="library__step" :class="`library__step--${step.accent}`">
            <span class="library__step-index">{{ step.index }}</span>
            <span class="library__step-label">{{ step.label }}</span>
          </RouterLink>
        </li>
      </ol>
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped lang="scss" src="@/scss/LibraryPage.scss"></style>
