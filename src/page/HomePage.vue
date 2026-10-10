<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AlgorithmCard from '@/component/AlgorithmCard.vue'
import BarCanvas from '@/component/BarCanvas.vue'
import GraphCanvas from '@/component/GraphCanvas.vue'
import SiteFooter from '@/component/SiteFooter.vue'
import { createBubbleSortSteps } from '@/algorithms/bubbleSort'
import { MODULES } from '@/data/library'
import { padNumber } from '@/utils/format'
import { PREVIEW_BARS, createDijkstraPreview, createPreviewStates } from '@/utils/preview'

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
// 演算法模組
// ---------------------------------------------------------------------------

const moduleCount = padNumber(MODULES.length)
const dijkstraPreview = createDijkstraPreview()
</script>

<template>
  <div class="home">
    <section class="home__hero">
      <div class="home__intro">
        <span class="home__eyebrow">ALGORITHM STUDIO / 001</span>
        <h1 class="home__headline">看懂每一次<br />交換與選擇。</h1>
        <p class="home__lead">把抽象的演算法，轉化成可暫停、可拆解、可親手操控的視覺體驗。</p>
        <div class="home__actions">
          <RouterLink to="/Library" class="home__btn home__btn--primary">進入工作台</RouterLink>
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
        <span class="home__modules-count">{{ moduleCount }} MODULES</span>
      </div>

      <div class="home__cards">
        <AlgorithmCard
          v-for="m in MODULES"
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
              class="home__mini-bars"
              :arr="PREVIEW_BARS"
              :bar-states="createPreviewStates(m.previewState)"
              compact
            />
            <GraphCanvas
              v-else
              class="home__graph"
              :graph="dijkstraPreview.graph"
              :node-states="dijkstraPreview.nodeStates"
              :edge-states="dijkstraPreview.edgeStates"
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
