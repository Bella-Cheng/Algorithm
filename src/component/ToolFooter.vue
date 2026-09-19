<script setup lang="ts">
withDefaults(
  defineProps<{
    currentStep?: number
    totalSteps?: number
    isPlaying?: boolean
    speedOptions?: number[]
    activeSpeed?: number
  }>(),
  {
    currentStep: 0,
    totalSteps: 0,
    isPlaying: false,
    speedOptions: () => [0.5, 1, 2],
    activeSpeed: 1,
  },
)

defineEmits<{
  reset: []
  prev: []
  next: []
  togglePlay: []
  changeSpeed: [speed: number]
}>()
</script>

<template>
  <footer class="tool-footer">
    <div class="tool-footer__controls">
      <button type="button" class="tool-footer__icon-btn" aria-label="重置" @click="$emit('reset')">
        ↺
      </button>
      <button
        type="button"
        class="tool-footer__icon-btn"
        aria-label="上一步"
        :disabled="currentStep <= 0"
        @click="$emit('prev')"
      >
        ‹
      </button>
      <button type="button" class="tool-footer__play-btn" @click="$emit('togglePlay')">
        <span class="tool-footer__play-icon">{{ isPlaying ? '❚❚' : '▶' }}</span>
        {{ isPlaying ? '暫停' : '執行' }}
      </button>
      <button
        type="button"
        class="tool-footer__icon-btn"
        aria-label="下一步"
        :disabled="currentStep >= totalSteps"
        @click="$emit('next')"
      >
        ›
      </button>
    </div>

    <div class="tool-footer__progress">
      <span class="tool-footer__progress-label">執行進度</span>
      <div class="tool-footer__progress-track">
        <div
          class="tool-footer__progress-fill"
          :style="{ width: `${totalSteps ? (currentStep / totalSteps) * 100 : 0}%` }"
        ></div>
      </div>
    </div>

    <span class="tool-footer__step-count">
      {{ String(currentStep).padStart(2, '0') }} / {{ String(totalSteps).padStart(2, '0') }}
    </span>

    <div class="tool-footer__speed">
      <span class="tool-footer__speed-label">速度</span>
      <button
        v-for="speed in speedOptions"
        :key="speed"
        type="button"
        class="tool-footer__speed-btn"
        :class="{ 'tool-footer__speed-btn--active': speed === activeSpeed }"
        @click="$emit('changeSpeed', speed)"
      >
        {{ speed }}×
      </button>
    </div>
  </footer>
</template>

<style scoped lang="scss" src="@/scss/ToolFooter.scss"></style>
