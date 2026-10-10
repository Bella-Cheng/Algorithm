<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { ModuleAccent } from '@/types/library'

withDefaults(
  defineProps<{
    index: string
    title: string
    description: string
    /** 時間複雜度，如 O(n²) */
    complexity: string
    to: RouteLocationRaw
    /** 強調色：編號與 hover 外框 */
    accent?: ModuleAccent
  }>(),
  {
    accent: 'lime',
  },
)
</script>

<template>
  <RouterLink :to="to" class="algorithm-card" :class="`algorithm-card--${accent}`">
    <div class="algorithm-card__meta">
      <span class="algorithm-card__index">{{ index }}</span>
      <span class="algorithm-card__complexity">{{ complexity }}</span>
    </div>

    <h3 class="algorithm-card__title">{{ title }}</h3>
    <p class="algorithm-card__desc">{{ description }}</p>

    <!-- 預覽圖由外層決定：排序用 BarCanvas、圖論用 GraphCanvas -->
    <div class="algorithm-card__preview" aria-hidden="true">
      <slot name="preview" />
    </div>
  </RouterLink>
</template>

<style scoped lang="scss" src="@/scss/AlgorithmCard.scss"></style>
