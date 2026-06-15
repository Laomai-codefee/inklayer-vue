<template><div style="display:none" /></template>
<script setup lang="ts">
import { inject, watch } from 'vue'
import { PdfViewerContextKey } from '@/context/pdfViewerContext'

const props = withDefaults(defineProps<{
  onDocumentLoaded?: ((viewer: any) => void) | null
  onEventBusReady?: ((bus: any) => void) | null
}>(), { onDocumentLoaded: null, onEventBusReady: null })

const ctx = inject(PdfViewerContextKey)!

// Emit eventBusReady — matches React ViewerExtension useEffect on [isReady, pdfViewer, eventBus]
watch(
  () => ctx.isReady.value && ctx.pdfViewer.value && ctx.eventBus.value,
  (ready) => {
    if (!ready) return
    const viewer = ctx.pdfViewer.value
    const bus = ctx.eventBus.value

    props.onEventBusReady?.(bus)

    const handleDocumentLoaded = async () => {
      props.onDocumentLoaded?.(viewer)
    }

    if (viewer.pdfDocument) {
      handleDocumentLoaded()
    } else {
      bus.on('documentloaded', handleDocumentLoaded)
    }
  },
  { immediate: false }
)

// Dispatch updateviewarea when sidebar toggles — matches React
watch(
  () => ctx.isSidebarCollapsed.value,
  () => {
    const bus = ctx.eventBus.value
    const viewer = ctx.pdfViewer.value
    if (bus && viewer) bus.dispatch('updateviewarea', { pdfViewer: viewer })
  }
)
</script>
