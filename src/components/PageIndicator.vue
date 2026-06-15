<template>
  <div
    v-if="enabled"
    class="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] rounded text-white transition-opacity duration-300 select-none"
    :style="{ background: 'rgba(60,60,60,0.85)', opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }"
    @mouseover="showTemporarily"
  >
    <div class="flex items-center gap-2 py-1 pl-1 pr-2">
      <button
        class="inline-flex items-center justify-center size-6 rounded text-white hover:bg-white/10 transition-colors shrink-0"
        :class="currentPage <= 1 || isPageChanging ? '!text-white/30 cursor-default' : 'cursor-pointer'"
        :disabled="currentPage <= 1 || isPageChanging"
        @click="handlePrevPage">
        <Icon name="left" :size="10" />
      </button>

      <div class="flex items-center gap-1 pr-2">
        <input
          v-model="inputPage"
          class="w-[30px] font-bold text-right text-white bg-transparent border-none outline-none text-xs"
          :style="{ borderColor: inputValid ? 'transparent' : 'red' }"
          :disabled="isPageChanging"
          @keydown="handleKeyDown"
          @blur="handleGoToPage"
          @input="showTemporarily" />
        <span class="text-xs font-medium w-[30px]">/ {{ totalPages }}</span>
      </div>

      <button
        class="inline-flex items-center justify-center size-6 rounded text-white hover:bg-white/10 transition-colors shrink-0"
        :class="currentPage >= totalPages || isPageChanging ? '!text-white/30 cursor-default' : 'cursor-pointer'"
        :disabled="currentPage >= totalPages || isPageChanging"
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

const AUTO_HIDE_DELAY = 1500

const ctx = inject(PdfViewerContextKey)!
const pdfViewer = ctx.pdfViewer
const isReady = ctx.isReady

const currentPage = ref(1)
const totalPages = ref(1)
const inputPage = ref('1')
const isPageChanging = ref(false)
const enabled = ref(false)
const visible = ref(true)

let hideTimer: ReturnType<typeof setTimeout> | null = null

function showTemporarily() {
  visible.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { visible.value = false }, AUTO_HIDE_DELAY)
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
watch([() => pdfViewer?.value, isReady], ([viewer, ready]) => {
  if (!viewer || !ready) return
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
  viewer.eventBus.on('pagechanging', onPageChange)

  // Container scroll/wheel events
  const container = (viewer as any).container || viewer.viewer
  if (container) {
    container.addEventListener('scroll', showTemporarily, { passive: true })
    container.addEventListener('wheel', showTemporarily, { passive: true })
  }
}, { immediate: true })

onUnmounted(() => { if (hideTimer) clearTimeout(hideTimer) })
</script>
