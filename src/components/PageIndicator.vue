<template>
  <div
    v-if="enabled"
    class="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] rounded text-white transition-opacity duration-300 select-none"
    :style="{ background: 'rgba(60,60,60,0.85)', opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <div class="flex items-center gap-2 py-1 pl-1 pr-2">
      <button
        class="inline-flex items-center justify-center size-6 rounded text-white hover:bg-white/10 transition-colors shrink-0"
        :class="currentPage <= 1 || isPageChanging ? '!text-white/30 cursor-default' : 'cursor-pointer'"
        :disabled="currentPage <= 1 || isPageChanging"
        :aria-label="t('viewer.navigation.previousPage')"
        @click="handlePrevPage">
        <Icon name="left" :size="10" />
      </button>

      <div class="flex items-center gap-1 pr-2">
        <input
          ref="inputRef"
          v-model="inputPage"
          class="w-[40px] font-bold text-right text-white bg-transparent border-none outline-none text-xs"
          :style="{ borderColor: inputValid ? 'transparent' : 'red' }"
          :disabled="isPageChanging"
          :aria-label="t('viewer.navigation.pageInput')"
          @keydown="handleKeyDown"
          @blur="handleGoToPage"
          @dblclick="selectInputText"
          @input="showTemporarily" />
        <span class="text-xs font-medium w-[40px]">/ {{ totalPages }}</span>
      </div>

      <button
        class="inline-flex items-center justify-center size-6 rounded text-white hover:bg-white/10 transition-colors shrink-0"
        :class="currentPage >= totalPages || isPageChanging ? '!text-white/30 cursor-default' : 'cursor-pointer'"
        :disabled="currentPage >= totalPages || isPageChanging"
        :aria-label="t('viewer.navigation.nextPage')"
        @click="handleNextPage">
        <Icon name="right" :size="10" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, inject } from 'vue'
import { PdfViewerContextKey } from '@/context/pdfViewerContext'
import Icon from '@/components/Icon.vue'
import { useT } from '@/composables/useT'

const AUTO_HIDE_DELAY = 3000

const ctx = inject(PdfViewerContextKey)!
const pdfViewer = ctx.pdfViewer
const eventBus = ctx.eventBus
const isReady = ctx.isReady
const { t } = useT()

const inputRef = ref<HTMLInputElement | null>(null)
const currentPage = ref(1)
const totalPages = ref(1)
const inputPage = ref('1')
const isPageChanging = ref(false)
const enabled = ref(false)
const visible = ref(true)

let hideTimer: ReturnType<typeof setTimeout> | null = null
let hovered = false
let focused = false

function showTemporarily() {
  visible.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = null
  if (hovered || focused) return
  hideTimer = setTimeout(() => { visible.value = false }, AUTO_HIDE_DELAY)
}

function handleMouseEnter() {
  hovered = true
  visible.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = null
}

function handleMouseLeave() {
  hovered = false
  showTemporarily()
}

function handleFocusIn() {
  focused = true
  visible.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = null
}

function handleFocusOut() {
  focused = false
  showTemporarily()
}

function selectInputText() {
  inputRef.value?.select()
}

const inputValid = ref(true)

function isValidPage(page: number): boolean {
  return !isNaN(page) && page >= 1 && page <= totalPages.value
}

function handlePageChange(page: number) {
  const viewer = pdfViewer?.value
  if (!viewer || !isValidPage(page)) return
  showTemporarily()
  isPageChanging.value = true
  try {
    viewer.currentPageNumber = page
    currentPage.value = page
    inputPage.value = page.toString()
  } catch (e) {
    console.error('Error changing page:', e)
  } finally {
    isPageChanging.value = false
  }
}

function handleGoToPage() {
  showTemporarily()
  const page = parseInt(inputPage.value, 10)
  if (isValidPage(page)) {
    handlePageChange(page)
  } else {
    inputPage.value = currentPage.value.toString()
  }
  inputValid.value = inputPage.value === '' || isValidPage(parseInt(inputPage.value, 10))
}

function handlePrevPage() {
  showTemporarily()
  if (currentPage.value > 1) handlePageChange(currentPage.value - 1)
}
function handleNextPage() {
  showTemporarily()
  if (currentPage.value < totalPages.value) handlePageChange(currentPage.value + 1)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleGoToPage()
  else if (e.key === 'Escape') inputPage.value = currentPage.value.toString()
}

// Watch viewer + isReady
watch([pdfViewer, eventBus, isReady], ([viewer, bus, ready], _previous, onCleanup) => {
  if (!viewer || !bus || !ready) {
    enabled.value = false
    return
  }
  currentPage.value = viewer.currentPageNumber || 1
  totalPages.value = viewer.pagesCount || 1
  inputPage.value = currentPage.value.toString()
  enabled.value = true
  showTemporarily()

  // pagechanging event
  const onPageChange = ({ pageNumber }: { pageNumber: number }) => {
    currentPage.value = pageNumber
    inputPage.value = pageNumber.toString()
    isPageChanging.value = false
    showTemporarily()
  }
  bus.on('pagechanging', onPageChange)

  // Container scroll/wheel events
  const container = (viewer as any).container || viewer.viewer
  if (container) {
    container.addEventListener('scroll', showTemporarily, { passive: true })
    container.addEventListener('wheel', showTemporarily, { passive: true })
  }

  onCleanup(() => {
    bus.off('pagechanging', onPageChange)
    container?.removeEventListener('scroll', showTemporarily)
    container?.removeEventListener('wheel', showTemporarily)
  })
}, { immediate: true })

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer)
})
</script>
