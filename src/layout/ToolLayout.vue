<script setup lang="ts">
import ToolFooter from '@/component/ToolFooter.vue'
</script>

<template>
  <div class="tool-layout">
    <div class="tool-layout__body">
      <aside class="tool-layout__sidebar tool-layout__sidebar--left">
        <slot name="left" />
      </aside>

      <main class="tool-layout__main">
        <slot />
      </main>

      <aside class="tool-layout__sidebar tool-layout__sidebar--right">
        <slot name="right" />
      </aside>
    </div>

    <ToolFooter />
  </div>
</template>

<style scoped lang="scss" src="@/scss/ToolLayout.scss"></style>
