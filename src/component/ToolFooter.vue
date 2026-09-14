<script setup lang="ts">
withDefaults(
  defineProps<{
    currentStep?: number
    totalSteps?: number
    speedOptions?: number[]
    activeSpeed?: number
  }>(),
  {
    currentStep: 6,
    totalSteps: 16,
    speedOptions: () => [0.5, 1, 2],
    activeSpeed: 1,
  },
)
</script>

<template>
  <footer class="tool-footer">
    <div class="tool-footer__controls">
      <button type="button" class="tool-footer__icon-btn" aria-label="重置">↺</button>
      <button type="button" class="tool-footer__icon-btn" aria-label="上一步">‹</button>
      <button type="button" class="tool-footer__play-btn">
        <span class="tool-footer__play-icon">▶</span>
        執行
      </button>
      <button type="button" class="tool-footer__icon-btn" aria-label="下一步">›</button>
    </div>

    <div class="tool-footer__progress">
      <span class="tool-footer__progress-label">執行進度</span>
      <div class="tool-footer__progress-track">
        <div
          class="tool-footer__progress-fill"
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        ></div>
      </div>
    </div>

    <span class="tool-footer__step-count">
      {{ String(currentStep).padStart(2, '0') }} / {{ totalSteps }}
    </span>

    <div class="tool-footer__speed">
      <span class="tool-footer__speed-label">速度</span>
      <button
        v-for="speed in speedOptions"
        :key="speed"
        type="button"
        class="tool-footer__speed-btn"
        :class="{ 'tool-footer__speed-btn--active': speed === activeSpeed }"
      >
        {{ speed }}×
      </button>
    </div>
  </footer>
</template>

<style scoped lang="scss" src="@/scss/ToolFooter.scss"></style>
