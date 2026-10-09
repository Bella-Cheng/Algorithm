<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    fileName: string
    language?: string
    /** 每一行程式碼 */
    lines?: string[]
    /** 要高亮的行號（從 1 開始） */
    highlightLines?: number[]
    /** 底部狀態列左側文字，如 COMPARE */
    statusLabel?: string
    /** 底部狀態列右側文字，如 0.31 ms */
    statusMeta?: string
  }>(),
  {
    language: 'TYPESCRIPT',
    lines: () => [],
    highlightLines: () => [],
    statusLabel: '',
    statusMeta: '',
  },
)

const bodyRef = ref<HTMLOListElement | null>(null)

/** 高亮行不在可視範圍時，只捲動程式碼區塊，把它們移到中間 */
function scrollToActive() {
  const body = bodyRef.value
  if (!body) return

  const activeLines = body.querySelectorAll<HTMLElement>('.code-panel__line--active')
  const first = activeLines[0]
  const last = activeLines[activeLines.length - 1]
  if (!first || !last) return

  const bodyRect = body.getBoundingClientRect()
  const top = first.getBoundingClientRect().top - bodyRect.top
  const bottom = last.getBoundingClientRect().bottom - bodyRect.top
  if (top >= 0 && bottom <= body.clientHeight) return

  // 範圍比可視區還高時，對齊第一行；否則置中
  const rangeHeight = bottom - top
  const offset = rangeHeight > body.clientHeight ? 16 : (body.clientHeight - rangeHeight) / 2
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  body.scrollTo({
    top: body.scrollTop + top - offset,
    behavior: reduceMotion ? 'auto' : 'smooth',
  })
}

watch(
  () => props.highlightLines.join(','),
  () => nextTick(scrollToActive),
)

/** 手機版從隱藏的分頁切回來時，面板高度從 0 變回來，再捲一次 */
let resizeObserver: ResizeObserver | undefined
let lastHeight = 0

onMounted(() => {
  if (!bodyRef.value) return
  resizeObserver = new ResizeObserver(([entry]) => {
    const height = entry?.contentRect.height ?? 0
    if (lastHeight === 0 && height > 0) scrollToActive()
    lastHeight = height
  })
  resizeObserver.observe(bodyRef.value)
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <div class="code-panel">
    <div class="code-panel__header">
      <span class="code-panel__file">{{ fileName }}</span>
      <span class="code-panel__language">{{ language }}</span>
    </div>

    <ol ref="bodyRef" class="code-panel__body">
      <li
        v-for="(line, index) in lines"
        :key="index"
        class="code-panel__line"
        :class="{ 'code-panel__line--active': highlightLines.includes(index + 1) }"
      >
        <span class="code-panel__line-no">{{ String(index + 1).padStart(2, '0') }}</span>
        <code class="code-panel__code">{{ line }}</code>
      </li>
    </ol>

    <div class="code-panel__footer">
      <span class="code-panel__status">
        <span class="code-panel__status-dot"></span>
        {{ statusLabel }}
      </span>
      <span class="code-panel__meta">{{ statusMeta }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/scss/CodePanel.scss"></style>
