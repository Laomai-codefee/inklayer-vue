<template>
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="icon" class="size-7" :disabled="isZoomOutDisabled" @click="zoomOut">
      <Icon name="zoomOut" :size="14" />
    </Button>
    <Button variant="ghost" size="icon" class="size-7" :disabled="isZoomInDisabled" @click="zoomIn">
      <Icon name="zoomIn" :size="14" />
    </Button>

    <DropdownMenu>
      <template #trigger>
        <Button variant="ghost" size="sm" class="h-7 w-24 px-1.5 text-xs tabular-nums">
          {{ currentScaleLabel }}
          <Icon name="downArrow" :size="8" class="ml-0.5" />
        </Button>
      </template>
      <DropdownMenuItem
        v-for="opt in ZOOM_OPTIONS"
        :key="opt.key"
        class="text-xs"
        :class="currentScale === opt.value ? 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-foreground' : ''"
        @select="handleZoomChange(opt.value)"
      >{{ opt.label }}</DropdownMenuItem>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, watch, computed } from 'vue'
import { useT } from '@/composables/useT'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import Icon from '@/components/Icon.vue'
import { PdfViewerContextKey } from '@/context/pdfViewerContext'

const { t } = useT()

const ZOOM_CONFIG = { MIN_SCALE: 0.1, MAX_SCALE: 5, ZOOM_STEP: 0.1 } as const
const ZOOM_OPTIONS = computed(() => [
  { key: 'auto', label: t('viewer.zoom.auto'), value: 'auto' },
  { key: 'page-actual', label: t('viewer.zoom.actual'), value: 'page-actual' },
  { key: 'page-fit', label: t('viewer.zoom.fit'), value: 'page-fit' },
  { key: 'page-width', label: t('viewer.zoom.width'), value: 'page-width' },
  { key: '0.5', label: '50%', value: '0.5' },
  { key: '0.75', label: '75%', value: '0.75' },
  { key: '1', label: '100%', value: '1' },
  { key: '1.25', label: '125%', value: '1.25' },
  { key: '1.5', label: '150%', value: '1.5' },
  { key: '2', label: '200%', value: '2' },
  { key: '3', label: '300%', value: '3' },
  { key: '4', label: '400%', value: '4' },
])

const ctx = inject(PdfViewerContextKey)!
const currentScale = ref('auto')

watch(ctx.pdfViewer, (viewer) => {
  if (!viewer) return
  currentScale.value = viewer.currentScaleValue || 'auto'
  viewer.eventBus.on('updateviewarea', () => { currentScale.value = viewer.currentScaleValue || 'auto' })
}, { immediate: true })

function getNumericScale(scale: string): number | null {
  if (['auto', 'page-actual', 'page-fit', 'page-width'].includes(scale)) return null
  const num = parseFloat(scale); return isNaN(num) ? null : num
}
function handleZoomChange(newScale: string) { currentScale.value = newScale; if (ctx.pdfViewer.value) ctx.pdfViewer.value.currentScaleValue = newScale }
function zoomIn() { const scale = getNumericScale(currentScale.value) ?? (ctx.pdfViewer.value?.currentScale ?? 1); handleZoomChange((Math.round(Math.min(scale + ZOOM_CONFIG.ZOOM_STEP, ZOOM_CONFIG.MAX_SCALE) * 100) / 100).toString()) }
function zoomOut() { const scale = getNumericScale(currentScale.value) ?? (ctx.pdfViewer.value?.currentScale ?? 1); handleZoomChange((Math.round(Math.max(scale - ZOOM_CONFIG.ZOOM_STEP, ZOOM_CONFIG.MIN_SCALE) * 100) / 100).toString()) }
const isZoomInDisabled = computed(() => { const scale = getNumericScale(currentScale.value) ?? (ctx.pdfViewer.value?.currentScale ?? 1); return scale >= ZOOM_CONFIG.MAX_SCALE })
const isZoomOutDisabled = computed(() => { const scale = getNumericScale(currentScale.value) ?? (ctx.pdfViewer.value?.currentScale ?? 1); return scale <= ZOOM_CONFIG.MIN_SCALE })
const currentScaleLabel = computed(() => { const m = ZOOM_OPTIONS.value.find((o) => o.value === currentScale.value); if (m) return m.label; const n = parseFloat(currentScale.value); return !isNaN(n) ? `${Math.round(n * 100)}%` : t('viewer.zoom.auto') })
</script>
