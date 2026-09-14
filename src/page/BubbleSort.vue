<script setup lang="ts">
import ToolHeader from '@/component/ToolHeader.vue'
import ToolLayout from '@/layout/ToolLayout.vue'
</script>

<template>
  <div class="bubble-sort-page">
    <ToolHeader
      index="01"
      title-zh="氣泡排序"
      title-en="BUBBLE SORT"
      time="O(n²)"
      space="O(1)"
      status-label="STABLE"
      status-value="YES"
      status-variant="primary"
    />

    <ToolLayout>
      <template #left></template>
      <template #right></template>
    </ToolLayout>
  </div>
</template>

<style scoped>
.bubble-sort-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
</style>
