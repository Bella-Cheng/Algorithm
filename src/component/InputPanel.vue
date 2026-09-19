<script setup lang="ts">
import type { BarState } from '@/types/sort'

withDefaults(
  defineProps<{
    /** 原始輸入陣列 */
    arr?: number[]
    /** CURRENT STEP 卡片標籤，如 COMPARE / 03 */
    stepLabel?: string
    /** CURRENT STEP 卡片說明 */
    stepText?: string
  }>(),
  {
    arr: () => [],
    stepLabel: '',
    stepText: '',
  },
)

defineEmits<{
  regenerate: []
}>()

/** 圖例，顏色與 BarChart 的長條狀態一致 */
const LEGENDS: { state: BarState; label: string }[] = [
  { state: 'active', label: '選中' },
  { state: 'comparing', label: '比較中' },
  { state: 'sorted', label: '已排序' },
  { state: 'default', label: '尚未處理' },
]
</script>

<template>
  <div class="input-panel">
    <section class="input-panel__section">
      <h2 class="input-panel__title">INPUT DATA</h2>

      <div class="input-panel__data">
        <span class="input-panel__data-label">陣列</span>
        <p class="input-panel__data-values">{{ arr.join(', ') }}</p>
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
        <li v-for="legend in LEGENDS" :key="legend.state" class="input-panel__legend-item">
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
