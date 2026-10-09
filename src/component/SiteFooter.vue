<script setup lang="ts">
withDefaults(
  defineProps<{
    tagline?: string
  }>(),
  {
    tagline: '從每一步，看見思考的形狀。',
  },
)

/** 取自 package.json 的 version */
const version = `v${__APP_VERSION__}`
</script>

<!-- 首頁、演算法庫等內容頁共用的頁尾；工具頁底部是播放控制列 ToolFooter，不是這個 -->
<template>
  <footer class="site-footer">
    <p class="site-footer__tagline">{{ tagline }}</p>
    <span class="site-footer__credit">
      DESIGNED BY
      <a
        href="https://github.com/Bella-Cheng"
        target="_blank"
        rel="noopener noreferrer"
        class="site-footer__author"
      >@Bella-Cheng</a>
      / {{ version }}
    </span>
  </footer>
</template>

<style scoped lang="scss" src="@/scss/SiteFooter.scss"></style>
