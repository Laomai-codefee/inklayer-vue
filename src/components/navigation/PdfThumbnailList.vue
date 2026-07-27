<template>
  <div
    v-if="pdfDocument"
    class="thumbnail-list flex flex-col items-center gap-3.5 px-2 pb-6 pt-3.5"
    @pointerdown="stopAutoFollow"
    @touchstart="stopAutoFollow"
    @wheel="stopAutoFollow"
  >
    <PdfThumbnail
      v-for="pageNumber in pdfDocument.numPages"
      :key="pageNumber"
      :pdf-document="pdfDocument"
      :page-number="pageNumber"
      :selected="pageNumber === currentPage"
      :marker-count="pageMarkerCounts.get(pageNumber) ?? 0"
      @select="handlePageSelect"
      @layout-change="keepCurrentThumbnailVisible"
      @element-change="registerElement"
    />
  </div>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, ref, watch } from 'vue'
import { PdfViewerContextKey } from '@/context/pdfViewerContext'
import PdfThumbnail from './PdfThumbnail.vue'

defineProps<{
  pageMarkerCounts: ReadonlyMap<number, number>
}>()

const context = inject(PdfViewerContextKey)!
const currentPage = ref(1)
const thumbnailElements = new Map<number, HTMLButtonElement>()
let animationFrame: number | null = null
let autoFollowCurrentPage = true

function registerElement(pageNumber: number, element: HTMLButtonElement | null) {
  if (element) {
    thumbnailElements.set(pageNumber, element)
    if (pageNumber === currentPage.value) keepCurrentThumbnailVisible()
  } else {
    thumbnailElements.delete(pageNumber)
  }
}

function cancelScheduledScroll() {
  if (animationFrame !== null) {
    window.cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

function keepCurrentThumbnailVisible() {
  if (!autoFollowCurrentPage) return
  cancelScheduledScroll()
  animationFrame = window.requestAnimationFrame(() => {
    animationFrame = null
    thumbnailElements.get(currentPage.value)?.scrollIntoView({ block: 'nearest' })
  })
}

function stopAutoFollow() {
  autoFollowCurrentPage = false
  cancelScheduledScroll()
}

function handlePageSelect(pageNumber: number) {
  const viewer = context.pdfViewer.value
  if (!viewer) return
  autoFollowCurrentPage = true
  currentPage.value = pageNumber
  viewer.currentPageNumber = pageNumber
}

watch(
  [context.pdfViewer, context.eventBus],
  ([viewer, eventBus], _previous, onCleanup) => {
    if (!viewer || !eventBus) return
    currentPage.value = viewer.currentPageNumber || 1
    autoFollowCurrentPage = true

    const handlePageChanging = ({ pageNumber }: { pageNumber: number }) => {
      autoFollowCurrentPage = true
      currentPage.value = pageNumber
    }
    eventBus.on('pagechanging', handlePageChanging)
    onCleanup(() => eventBus.off('pagechanging', handlePageChanging))
  },
  { immediate: true },
)

watch([currentPage, context.pdfDocument], () => {
  autoFollowCurrentPage = true
  keepCurrentThumbnailVisible()
}, { immediate: true })

onBeforeUnmount(cancelScheduledScroll)

const pdfDocument = context.pdfDocument
</script>
