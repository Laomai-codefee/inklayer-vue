<template>
  <button
    ref="itemRef"
    type="button"
    class="thumbnail group block cursor-pointer appearance-none rounded-md border border-transparent bg-transparent p-[0px] text-inherit focus-visible:outline-none"
    :aria-current="selected ? 'page' : undefined"
    :aria-label="pageLabel"
    @click="emit('select', pageNumber)"
  >
    <span
      class="thumbnail-canvas-wrapper relative flex min-h-[88px] w-[132px] items-center justify-center overflow-hidden rounded-md border-2 bg-white shadow-sm transition-[border-color,box-shadow] duration-150 group-hover:shadow-md group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring"
      :class="selected
        ? '!border-primary group-hover:!border-primary'
        : 'border-border group-hover:border-foreground/20'"
      :style="{ height: `${thumbnailHeight}px` }"
    >
      <canvas ref="canvasRef" class="block max-w-full" />
      <span v-if="!rendered && !renderFailed" class="absolute inset-0 animate-pulse bg-muted" />
      <span v-if="renderFailed" class="thumbnail-error absolute inset-0 flex items-center justify-center bg-muted p-3 text-center text-xs text-muted-foreground">
        {{ t('viewer.navigation.thumbnailError') }}
      </span>
      <span
        v-if="markerCount > 0"
        class="thumbnail-marker pointer-events-none absolute right-[5px] top-[5px] flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-primary px-1 text-[10px] font-semibold leading-none text-white"
        aria-hidden="true"
      >
        {{ markerCount > 99 ? '99+' : markerCount }}
      </span>
      <span class="pointer-events-none absolute bottom-[5px] left-1/2 flex h-[18px] min-w-7 -translate-x-1/2 items-center justify-center rounded-md bg-muted px-1.5 text-[11px] font-semibold tabular-nums leading-none text-foreground">
        {{ pageNumber }}
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { useT } from '@/composables/useT'

const THUMBNAIL_WIDTH = 132
const DEFAULT_THUMBNAIL_HEIGHT = 176
const PRELOAD_MARGIN = '320px 0px'

interface DocumentThumbnailLayout {
  defaultHeight: Ref<number>
  pageHeights: Map<number, number>
}

const documentThumbnailLayouts = new WeakMap<PDFDocumentProxy, DocumentThumbnailLayout>()

function getDocumentThumbnailLayout(pdfDocument: PDFDocumentProxy): DocumentThumbnailLayout {
  const cachedLayout = documentThumbnailLayouts.get(pdfDocument)
  if (cachedLayout) return cachedLayout

  const layout: DocumentThumbnailLayout = {
    defaultHeight: ref(DEFAULT_THUMBNAIL_HEIGHT),
    pageHeights: new Map(),
  }
  documentThumbnailLayouts.set(pdfDocument, layout)

  void pdfDocument.getPage(1).then(page => {
    const viewport = page.getViewport({ scale: 1 })
    layout.defaultHeight.value = Math.round(
      THUMBNAIL_WIDTH * viewport.height / viewport.width,
    )
  }).catch(() => {
    // Keep the neutral fallback ratio when page dimensions cannot be resolved.
  })

  return layout
}

const props = defineProps<{
  pdfDocument: PDFDocumentProxy
  pageNumber: number
  selected: boolean
  markerCount: number
}>()

const emit = defineEmits<{
  select: [pageNumber: number]
  layoutChange: []
  elementChange: [pageNumber: number, element: HTMLButtonElement | null]
}>()

const { t } = useT()
const itemRef = ref<HTMLButtonElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const shouldRender = ref(false)
const rendered = ref(false)
const renderFailed = ref(false)
const resolvedThumbnailHeight = ref<number | null>(
  getDocumentThumbnailLayout(props.pdfDocument).pageHeights.get(props.pageNumber) ?? null,
)
let observer: IntersectionObserver | null = null
let renderTask: ReturnType<PDFPageProxy['render']> | null = null
let renderGeneration = 0

const thumbnailHeight = computed(
  () => resolvedThumbnailHeight.value
    ?? getDocumentThumbnailLayout(props.pdfDocument).defaultHeight.value,
)

watch(
  [() => props.pdfDocument, () => props.pageNumber],
  ([pdfDocument, pageNumber]) => {
    resolvedThumbnailHeight.value = getDocumentThumbnailLayout(pdfDocument)
      .pageHeights.get(pageNumber) ?? null
  },
)

const pageLabel = computed(() => props.markerCount > 0
  ? t('viewer.navigation.pageWithMarkers', {
      value: props.pageNumber,
      count: props.markerCount,
    })
  : t('viewer.navigation.page', { value: props.pageNumber }))

watch(itemRef, (element, previousElement) => {
  if (previousElement) emit('elementChange', props.pageNumber, null)
  if (!element) return

  emit('elementChange', props.pageNumber, element)
  if (shouldRender.value) return
  if (typeof IntersectionObserver === 'undefined') {
    shouldRender.value = true
    return
  }

  observer?.disconnect()
  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      shouldRender.value = true
      observer?.disconnect()
      observer = null
    }
  }, { rootMargin: PRELOAD_MARGIN })
  observer.observe(element)
}, { immediate: true })

watch(
  [shouldRender, () => props.pdfDocument, () => props.pageNumber],
  async ([canRender]) => {
    if (!canRender) return

    const generation = ++renderGeneration
    renderTask?.cancel()
    renderTask = null
    let activeRenderTask: ReturnType<PDFPageProxy['render']> | null = null
    rendered.value = false
    renderFailed.value = false

    try {
      const documentLayout = getDocumentThumbnailLayout(props.pdfDocument)
      const page = await props.pdfDocument.getPage(props.pageNumber)
      if (generation !== renderGeneration) return

      const canvas = canvasRef.value
      const context = canvas?.getContext('2d')
      if (!canvas || !context) return

      const baseViewport = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: THUMBNAIL_WIDTH / baseViewport.width })
      const outputScale = Math.min(window.devicePixelRatio || 1, 2)
      const renderedHeight = Math.round(viewport.height)

      canvas.width = Math.floor(viewport.width * outputScale)
      canvas.height = Math.floor(viewport.height * outputScale)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${renderedHeight}px`
      resolvedThumbnailHeight.value = renderedHeight
      documentLayout.pageHeights.set(props.pageNumber, renderedHeight)
      emit('layoutChange')

      activeRenderTask = page.render({
        canvasContext: context,
        viewport,
        transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
      })
      renderTask = activeRenderTask
      await activeRenderTask.promise
      if (generation === renderGeneration) rendered.value = true
    } catch (error) {
      if (generation === renderGeneration && (error as Error).name !== 'RenderingCancelledException') {
        renderFailed.value = true
      }
    } finally {
      if (renderTask === activeRenderTask) renderTask = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  renderGeneration += 1
  observer?.disconnect()
  renderTask?.cancel()
  emit('elementChange', props.pageNumber, null)
})
</script>
