// useSmoothZoom composable — Vue 3 version
// Migrated from React useSmoothZoom hook

import { ref, onMounted, onUnmounted, type Ref, type ShallowRef } from 'vue'
import type { PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'

interface UseSmoothZoomOptions {
  pdfViewer: Ref<PDFViewer | null>
  containerRef: Readonly<ShallowRef<HTMLElement | null>>
  minScale?: number
  maxScale?: number
}

export function useSmoothZoom({
  pdfViewer,
  containerRef,
  minScale = 0.1,
  maxScale = 5,
}: UseSmoothZoomOptions) {
  let baseScale = 1
  let visualScale = 1
  let commitTimer: ReturnType<typeof setTimeout> | null = null
  let anchor: {
    x: number
    y: number
    containerX: number
    containerY: number
  } | null = null

  const clamp = (v: number) => Math.min(maxScale, Math.max(minScale, v))

  function applyVisualScale(container: HTMLElement, viewerEl: HTMLElement, scale: number) {
    visualScale = scale
    viewerEl.style.transformOrigin = '0 0'
    viewerEl.style.transform = `scale(${scale})`

    if (anchor) {
      const targetScrollLeft = anchor.x * baseScale * scale - anchor.containerX
      const targetScrollTop = anchor.y * baseScale * scale - anchor.containerY
      container.scrollLeft = targetScrollLeft
      container.scrollTop = targetScrollTop
    }
  }

  function commitScale(container: HTMLElement, viewerEl: HTMLElement) {
    const viewer = pdfViewer.value
    if (!viewer) return

    const finalScale = clamp(baseScale * visualScale)
    viewerEl.style.transform = ''
    viewerEl.style.transformOrigin = ''
    viewer.currentScale = finalScale
    baseScale = finalScale
    visualScale = 1

    if (anchor) {
      container.scrollLeft = anchor.x * finalScale - anchor.containerX
      container.scrollTop = anchor.y * finalScale - anchor.containerY
      anchor = null
    }
  }

  function scheduleCommit(container: HTMLElement, viewerEl: HTMLElement) {
    if (commitTimer) clearTimeout(commitTimer)
    commitTimer = setTimeout(() => commitScale(container, viewerEl), 120)
  }

  function handleZoom(
    container: HTMLElement,
    viewerEl: HTMLElement,
    containerX: number,
    containerY: number,
    scaleFactor: number
  ) {
    if (!anchor) {
      anchor = {
        x: (container.scrollLeft + containerX) / (baseScale * visualScale),
        y: (container.scrollTop + containerY) / (baseScale * visualScale),
        containerX,
        containerY,
      }
    }

    const newVisualScale = visualScale * scaleFactor
    applyVisualScale(container, viewerEl, newVisualScale)
    scheduleCommit(container, viewerEl)
  }

  // Setup lifecycle
  onMounted(() => {
    const container = containerRef.value
    const viewer = pdfViewer.value
    if (!viewer || !container) return

    const viewerEl = container.querySelector('.pdfViewer') as HTMLElement
    if (!viewerEl) return

    baseScale = viewer.currentScale
    visualScale = 1

    let initialDistance = 0

    function getDistance(t1: Touch, t2: Touch) {
      return Math.sqrt((t2.clientX - t1.clientX) ** 2 + (t2.clientY - t1.clientY) ** 2)
    }

    function handleWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      e.stopPropagation()

      const rect = container!.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const isTrackpad = Math.abs(e.deltaY) < 50
      const step = isTrackpad ? 0.02 : 0.1
      const scaleFactor = e.deltaY < 0 ? 1 + step : 1 - step

      handleZoom(container!, viewerEl, cx, cy, scaleFactor)
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches[0], e.touches[1])
        e.preventDefault()
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || initialDistance <= 0) return
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const scaleFactor = currentDistance / initialDistance
      const rect = container!.getBoundingClientRect()
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top

      handleZoom(container!, viewerEl, cx, cy, scaleFactor)
      initialDistance = currentDistance
      e.preventDefault()
    }

    function handleTouchEnd() {
      initialDistance = 0
      if (anchor && visualScale !== 1) {
        setTimeout(() => {
          if (container && viewerEl) commitScale(container, viewerEl)
        }, 50)
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('touchcancel', handleTouchEnd)

    // Store cleanup
    const savedContainer = container
    onUnmounted(() => {
      savedContainer.removeEventListener('wheel', handleWheel)
      savedContainer.removeEventListener('touchstart', handleTouchStart)
      savedContainer.removeEventListener('touchmove', handleTouchMove)
      savedContainer.removeEventListener('touchend', handleTouchEnd)
      savedContainer.removeEventListener('touchcancel', handleTouchEnd)

      if (commitTimer) clearTimeout(commitTimer)
    })
  })

  function updateBaseScale() {
    const viewer = pdfViewer.value
    if (viewer) {
      baseScale = viewer.currentScale
      visualScale = 1
    }
  }

  return { updateBaseScale }
}
