<script setup lang="ts">
withDefaults(
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
</script>

<template>
  <div class="code-panel">
    <div class="code-panel__header">
      <span class="code-panel__file">{{ fileName }}</span>
      <span class="code-panel__language">{{ language }}</span>
    </div>

    <ol class="code-panel__body">
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
