<script setup lang="ts">
import type { LegendItem } from '@/types/sort'

withDefaults(
  defineProps<{
    /** 區塊標題，如 INPUT DATA / GRAPH DATA */
    title?: string
    /** 資料卡片上方的小標籤 */
    dataLabel?: string
    /** 資料卡片內容，沒傳時顯示 arr */
    dataText?: string
    /** 原始輸入陣列 */
    arr?: number[]
    /** CURRENT STEP 卡片標籤，如 COMPARE / 03 */
    stepLabel?: string
    /** CURRENT STEP 卡片說明 */
    stepText?: string
    /** 顏色圖例，由各演算法頁面傳入 */
    legends: LegendItem[]
  }>(),
  {
    title: 'INPUT DATA',
    dataLabel: '陣列',
    dataText: '',
    arr: () => [],
    stepLabel: '',
    stepText: '',
  },
)

defineEmits<{
  regenerate: []
}>()
</script>

<template>
  <div class="input-panel">
    <section class="input-panel__section">
      <h2 class="input-panel__title">{{ title }}</h2>

      <div class="input-panel__data">
        <span class="input-panel__data-label">{{ dataLabel }}</span>
        <p class="input-panel__data-values">{{ dataText || arr.join(', ') }}</p>
      </div>

      <button type="button" class="input-panel__generate" @click="$emit('regenerate')">
        <span aria-hidden="true">＋</span>
        產生新資料
      </button>
    </section>

    <section class="input-panel__section">
      <h2 class="input-panel__title">CURRENT STEP</h2>

      <div class="input-panel__step">
        <span class="input-panel__step-label">{{ stepLabel }}</span>
        <p class="input-panel__step-text">{{ stepText }}</p>
      </div>

      <ul class="input-panel__legend">
        <li v-for="legend in legends" :key="legend.state" class="input-panel__legend-item">
          <span
            class="input-panel__legend-dot"
            :class="`input-panel__legend-dot--${legend.state}`"
          ></span>
          {{ legend.label }}
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss" src="@/scss/InputPanel.scss"></style>
