<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

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

const emit = defineEmits<{
  reset: []
  prev: []
  next: []
  togglePlay: []
  changeSpeed: [speed: number]
}>()

/** 速度一律顯示一位小數，例如 1.0× */
function formatSpeed(speed: number) {
  return `${speed.toFixed(1)}×`
}

/** 速度下拉選單 */
const speedMenuOpen = ref(false)
const speedRef = ref<HTMLElement>()

function selectSpeed(speed: number) {
  emit('changeSpeed', speed)
  speedMenuOpen.value = false
}

/** 點選單外面時關閉 */
function onDocumentPointerDown(event: PointerEvent) {
  if (!speedRef.value?.contains(event.target as Node)) speedMenuOpen.value = false
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
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

    <!-- 桌機、平板：速度按鈕列 -->
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

    <!-- 手機：速度下拉選單 -->
    <div ref="speedRef" class="tool-footer__speed-dropdown">
      <button
        type="button"
        class="tool-footer__speed-trigger"
        aria-haspopup="listbox"
        :aria-expanded="speedMenuOpen"
        :aria-label="`播放速度 ${formatSpeed(activeSpeed)}`"
        @click="speedMenuOpen = !speedMenuOpen"
      >
        {{ formatSpeed(activeSpeed) }}
      </button>

      <ul v-if="speedMenuOpen" class="tool-footer__speed-menu" role="listbox">
        <li v-for="speed in speedOptions" :key="speed">
          <button
            type="button"
            role="option"
            class="tool-footer__speed-option"
            :class="{ 'tool-footer__speed-option--active': speed === activeSpeed }"
            :aria-selected="speed === activeSpeed"
            @click="selectSpeed(speed)"
          >
            {{ formatSpeed(speed) }}
          </button>
        </li>
      </ul>
    </div>
  </footer>
</template>

<style scoped lang="scss" src="@/scss/ToolFooter.scss"></style>
