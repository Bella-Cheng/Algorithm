<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import AlgorithmCard from '@/component/AlgorithmCard.vue'
import BarCanvas from '@/component/BarCanvas.vue'
import GraphCanvas from '@/component/GraphCanvas.vue'
import SiteFooter from '@/component/SiteFooter.vue'
import { MODULES } from '@/data/library'
import type { ModuleFilter } from '@/types/library'
import type { SelectOption } from '@/types/select'
import { padNumber } from '@/utils/format'
import { PREVIEW_BARS, createDijkstraPreview, createPreviewStates } from '@/utils/preview'

// ---------------------------------------------------------------------------
// 頁面用的固定資料
// ---------------------------------------------------------------------------

/** 篩選按鈕：類別與難度放在同一排，一次只選一個 */
const FILTERS: SelectOption<ModuleFilter>[] = [
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

const total = padNumber(MODULES.length)
const categoryCount = padNumber(new Set(MODULES.map((m) => m.category)).size)
const dijkstraPreview = createDijkstraPreview()

// ---------------------------------------------------------------------------
// 搜尋與篩選
// ---------------------------------------------------------------------------

const query = ref('')
const activeFilter = ref<ModuleFilter>('all')

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

/** 再點一次已選的按鈕時，ToggleGroup 會送出空值；忽略它，讓篩選永遠有一個被選中 */
function onFilterChange(value: unknown) {
  if (value) activeFilter.value = value as ModuleFilter
}

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
          顯示 {{ padNumber(filteredModules.length) }} / {{ total }}
        </span>
      </div>

      <!-- 選中狀態與 aria-pressed 由 Reka 處理，可用 ← → 切換 -->
      <ToggleGroupRoot
        type="single"
        :model-value="activeFilter"
        class="library__filters"
        aria-label="篩選演算法"
        @update:model-value="onFilterChange"
      >
        <ToggleGroupItem
          v-for="filter in FILTERS"
          :key="filter.value"
          :value="filter.value"
          class="library__filter"
        >
          {{ filter.label }}
        </ToggleGroupItem>
      </ToggleGroupRoot>
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
                :bar-states="createPreviewStates(m.previewState)"
                compact
              />
              <GraphCanvas
                v-else
                class="library__graph"
                :graph="dijkstraPreview.graph"
                :node-states="dijkstraPreview.nodeStates"
                :edge-states="dijkstraPreview.edgeStates"
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
