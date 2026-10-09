<script setup lang="ts">
import { computed } from 'vue'
import type { BarState } from '@/types/sort'

const props = withDefaults(
  defineProps<{
    /** 要顯示的數字陣列 */
    arr?: number[]
    /** 每根長條的狀態，與 arr 一一對應 */
    barStates?: BarState[]
    /** 長條下方顯示 [index] */
    showIndex?: boolean
    /** 精簡模式：不顯示數字與 index，給首頁卡片等小尺寸預覽用 */
    compact?: boolean
  }>(),
  {
    arr: () => [],
    barStates: () => [],
    showIndex: true,
    compact: false,
  },
)

/** 陣列最大值（空陣列時為 0） */
const maxValue = computed(() => (props.arr.length ? Math.max(...props.arr) : 0))

/** 計算柱子高度百分比（最大值為 0 時回傳 0%，避免除以 0） */
function getBarHeight(value: number) {
  if (maxValue.value === 0) return '0%'
  return `${(value / maxValue.value) * 100}%`
}
</script>

<!-- 長條本體，間距與圓角可由外層用 --bar-gap、--bar-radius 調整 -->
<template>
  <div
    class="bar-canvas"
    :class="{ 'bar-canvas--compact': compact, 'bar-canvas--no-index': !showIndex }"
  >
    <div
      v-for="(value, index) in arr"
      :key="index"
      class="bar-canvas__bar"
      :class="`bar-canvas__bar--${barStates[index] ?? 'default'}`"
      :style="{ height: getBarHeight(value) }"
    >
      <template v-if="!compact">
        <span class="bar-canvas__label">{{ value }}</span>
        <span v-if="showIndex" class="bar-canvas__index">[{{ index }}]</span>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/scss/BarCanvas.scss"></style>
