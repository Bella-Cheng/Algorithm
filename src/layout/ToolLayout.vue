<script setup lang="ts">
import { ref } from 'vue'

defineEmits<{
  /** 手機版「產生新資料」按鈕 */
  regenerate: []
}>()

/** 手機版下方目前顯示的面板 */
const activePanel = ref<'left' | 'right'>('left')
</script>

<template>
  <div class="tool-layout">
    <div class="tool-layout__body">
      <aside
        class="tool-layout__sidebar tool-layout__sidebar--left"
        :class="{ 'tool-layout__sidebar--inactive': activePanel !== 'left' }"
      >
        <slot name="left" />
      </aside>

      <main class="tool-layout__main">
        <slot />
      </main>

      <aside
        class="tool-layout__sidebar tool-layout__sidebar--right"
        :class="{ 'tool-layout__sidebar--inactive': activePanel !== 'right' }"
      >
        <slot name="right" />
      </aside>
    </div>

    <!-- 手機版才顯示：切換下方面板、產生新資料 -->
    <div class="tool-layout__tabs">
      <button
        type="button"
        class="tool-layout__tab"
        :class="{ 'tool-layout__tab--active': activePanel === 'left' }"
        :aria-pressed="activePanel === 'left'"
        @click="activePanel = 'left'"
      >
        步驟
      </button>
      <button
        type="button"
        class="tool-layout__tab"
        :class="{ 'tool-layout__tab--active': activePanel === 'right' }"
        :aria-pressed="activePanel === 'right'"
        @click="activePanel = 'right'"
      >
        程式碼
      </button>
      <button type="button" class="tool-layout__tab" @click="$emit('regenerate')">
        產生新資料
      </button>
    </div>

    <div class="tool-layout__player">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/scss/ToolLayout.scss"></style>
