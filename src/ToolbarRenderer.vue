<template>
  <div class="flex items-center gap-3">
    <ZoomTool />
    <Separator v-if="customToolbarSlot" orientation="vertical" class="h-6" />
    <component v-if="customToolbarSlot" :is="customToolbarSlot" />
  </div>
</template>
<script setup lang="ts">
import { inject, computed, type Component } from 'vue'
import ZoomTool from '@/extensions/annotator/components/toolbar/ZoomTool.vue'
import { Separator } from '@/components/ui/separator'
import { PdfViewerContextKey, type PdfViewerContextValue } from '@/context/pdfViewerContext'

const props = defineProps<{
  toolbar?: Component | ((ctx: PdfViewerContextValue) => any) | null
}>()

const ctx = inject(PdfViewerContextKey)!

const customToolbarSlot = computed(() => {
  if (!props.toolbar) return null
  if (typeof props.toolbar === 'function') return props.toolbar(ctx)
  return props.toolbar
})
</script>
