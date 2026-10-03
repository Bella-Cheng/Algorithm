<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

withDefaults(
  defineProps<{
    title?: string
    /** 標題下方的說明，如 設定資料範圍後套用至氣泡排序。 */
    description?: string
    /** 主要設定區塊的標題 */
    settingsTitle?: string
    /** #extra slot 區塊的標題，如 PIVOT */
    extraTitle?: string
    /** 按鈕上方的提示文字 */
    hint?: string
    confirmText?: string
    cancelText?: string
  }>(),
  {
    title: '產生新資料',
    description: '',
    settingsTitle: 'RANDOM SETTINGS',
    extraTitle: '',
    hint: '',
    confirmText: '產生並套用',
    cancelText: '取消',
  },
)

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  confirm: []
}>()

defineSlots<{
  /** 主要設定欄位，排成三欄 */
  default(): unknown
  /** 額外的設定區塊，例如快速排序的基準值 */
  extra?(): unknown
}>()

const titleId = useId()
const dialogRef = ref<HTMLElement>()

function close() {
  open.value = false
}

function confirm() {
  emit('confirm')
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

// 開啟時把焦點移進彈窗，並監聽 Esc 關閉
watch(open, async (value) => {
  if (value) {
    window.addEventListener('keydown', onKeydown)
    await nextTick()
    dialogRef.value?.focus()
  } else {
    window.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="data-modal">
      <div v-if="open" class="data-modal" @click.self="close">
        <div
          ref="dialogRef"
          class="data-modal__dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
        >
          <header class="data-modal__header">
            <div class="data-modal__heading">
              <h2 :id="titleId" class="data-modal__title">{{ title }}</h2>
              <p v-if="description" class="data-modal__description">{{ description }}</p>
            </div>
            <button type="button" class="data-modal__close" aria-label="關閉" @click="close">
              ✕
            </button>
          </header>

          <section class="data-modal__section">
            <h3 class="data-modal__section-title">{{ settingsTitle }}</h3>
            <div class="data-modal__fields">
              <slot />
            </div>
          </section>

          <section v-if="$slots.extra" class="data-modal__section">
            <h3 v-if="extraTitle" class="data-modal__section-title">{{ extraTitle }}</h3>
            <slot name="extra" />
          </section>

          <p v-if="hint" class="data-modal__hint">{{ hint }}</p>

          <footer class="data-modal__actions">
            <button type="button" class="data-modal__btn" @click="close">{{ cancelText }}</button>
            <button type="button" class="data-modal__btn data-modal__btn--primary" @click="confirm">
              {{ confirmText }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss" src="@/scss/DataModal.scss"></style>
