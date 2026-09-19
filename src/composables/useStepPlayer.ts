import { computed, onBeforeUnmount, ref, toValue, type MaybeRefOrGetter } from 'vue'

/** 1× 速度下每一步停留的毫秒數 */
const BASE_INTERVAL = 700

/**
 * 控制步驟動畫的播放：執行/暫停、上一步、下一步、重置與速度切換
 * @param lastStep 最後一步的索引（步驟總數 - 1）
 */
export function useStepPlayer(lastStep: MaybeRefOrGetter<number>) {
  const currentStep = ref(0)
  const isPlaying = ref(false)
  const speed = ref(1)
  let timer: ReturnType<typeof setTimeout> | undefined

  const isLastStep = computed(() => currentStep.value >= toValue(lastStep))

  function clearTimer() {
    if (timer === undefined) return
    clearTimeout(timer)
    timer = undefined
  }

  /** 排定下一步；速度改變時重新排定即可立即生效 */
  function scheduleNext() {
    clearTimer()
    timer = setTimeout(() => {
      if (!isLastStep.value) currentStep.value++
      if (isLastStep.value) pause()
      else scheduleNext()
    }, BASE_INTERVAL / speed.value)
  }

  function play() {
    // 已經播完時，從頭開始播放
    if (isLastStep.value) currentStep.value = 0
    isPlaying.value = true
    scheduleNext()
  }

  function pause() {
    isPlaying.value = false
    clearTimer()
  }

  function togglePlay() {
    if (isPlaying.value) pause()
    else play()
  }

  function next() {
    pause()
    if (!isLastStep.value) currentStep.value++
  }

  function prev() {
    pause()
    if (currentStep.value > 0) currentStep.value--
  }

  function reset() {
    pause()
    currentStep.value = 0
  }

  function setSpeed(value: number) {
    speed.value = value
    if (isPlaying.value) scheduleNext()
  }

  onBeforeUnmount(clearTimer)

  return { currentStep, isPlaying, speed, togglePlay, next, prev, reset, setSpeed }
}
