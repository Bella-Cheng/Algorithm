<script setup lang="ts">
import type { StatusVariant } from '@/types/tool'

withDefaults(
  defineProps<{
    index?: string
    titleZh: string
    titleEn: string
    time: string
    space: string
    statusLabel?: string
    statusValue?: string
    statusVariant?: StatusVariant
  }>(),
  {
    index: '01',
    statusLabel: 'STABLE',
    statusValue: 'YES',
    statusVariant: 'primary',
  },
)
</script>

<template>
  <header class="tool-header">
    <div class="tool-header__meta">
      <span class="tool-header__index">{{ index }}</span>
      <h1 class="tool-header__title">{{ titleZh }}</h1>
      <span class="tool-header__subtitle">{{ titleEn }}</span>
    </div>

    <div class="tool-header__stats">
      <div class="tool-header__chip">
        <span class="tool-header__chip-label">TIME</span>
        <span class="tool-header__chip-value">{{ time }}</span>
      </div>

      <div class="tool-header__chip">
        <span class="tool-header__chip-label">SPACE</span>
        <span class="tool-header__chip-value">{{ space }}</span>
      </div>

      <div
        class="tool-header__chip tool-header__chip--status"
        :class="`tool-header__chip--${statusVariant}`"
      >
        <span class="tool-header__chip-label">{{ statusLabel }}</span>
        <span class="tool-header__chip-value">{{ statusValue }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss" src="@/scss/ToolHeader.scss"></style>
