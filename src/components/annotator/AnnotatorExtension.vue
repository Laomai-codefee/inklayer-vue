<template>
  <div class="annotator-extension" style="display:contents">
    <SelectionBar ref="selectionBarRef" />
    <MenuBar ref="menuBarRef" :colors="colors" />
  </div>
</template>

<script lang="ts">
import { type InjectionKey, type Ref } from 'vue'
export const PainterKey = Symbol('AnnotatorPainter') as InjectionKey<Ref<Painter | null>>
</script>

<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { PdfViewerContextKey, UserContextKey } from '@/context/pdfViewerContext'
import { useAnnotationStore } from '@/stores/annotationStore'
import { Painter } from '@/extensions/annotator/painter'
import { annotationDefinitions, type IAnnotationStore, type IAnnotationType, type IAnnotationStyle } from '@/extensions/annotator/const/definitions'
import SelectionBar from '@/extensions/annotator/components/selection_bar/SelectionBar.vue'
import MenuBar from '@/extensions/annotator/components/menu_bar/MenuBar.vue'
import type { AnnotationPermissions, PdfAnnotatorOptions } from '@/extensions/annotator/types/annotator'
import { debounce, getThemeColor } from '@/utils'
import { storesToAnnotations } from '@/core/adapters/store.mapper'
import { FREE_TEXT_EDITOR } from '@/extensions/annotator/painter/const'

const props = defineProps<{
  defaultOptions?: PdfAnnotatorOptions; colors?: string[]; initialAnnotations?: any[]; annotationStyle?: IAnnotationStyle; enableNativeAnnotations?: boolean; annotationPermissions?: AnnotationPermissions
}>()
const emit = defineEmits<{
  'save': [annotations: any[]]; 'annotation-added': [annotation: any]; 'annotation-deleted': [id: string]
  'annotation-selected': [annotation: IAnnotationStore | null, isClick: boolean]; 'annotation-updated': [annotation: any]
}>()

const pdfContext = inject(PdfViewerContextKey)!
const userContext = inject(UserContextKey)
const store = useAnnotationStore()

let painter: Painter | null = null
let currentTool: IAnnotationType = annotationDefinitions[0]
let disposed = false

const selectionBarRef = ref<InstanceType<typeof SelectionBar> | null>(null)
const menuBarRef = ref<InstanceType<typeof MenuBar> | null>(null)
let cleanupEventHandlers: (() => void) | null = null

watch(() => props.annotationStyle, (newStyle) => {
  if (!newStyle || !currentTool?.styleEditable) return
  if (newStyle.color && currentTool.styleEditable.color) currentTool.style!.color = newStyle.color
  if (newStyle.strokeWidth !== undefined && currentTool.styleEditable.strokeWidth) currentTool.style!.strokeWidth = newStyle.strokeWidth
  if (newStyle.opacity !== undefined && currentTool.styleEditable.opacity) currentTool.style!.opacity = newStyle.opacity
}, { deep: true })

// Align React: debounced view-area cleanup (close MenuBar, SelectionBar, free-text editor)
const debouncedViewAreaChanged = debounce(() => {
  menuBarRef.value?.close()
  selectionBarRef.value?.close()
  const el = document.querySelector(`#${FREE_TEXT_EDITOR}`)
  if (el?.parentNode) try { el.parentNode.removeChild(el) } catch { /* ignore */ }
}, 100, true)

function initPainter() {
  const bus = pdfContext.eventBus.value; const viewer = pdfContext.pdfViewer.value
  if (!bus || !viewer) return
  const user = userContext?.user.value || { id: 'anonymous', name: 'Anonymous' }

  const currentPainter = new Painter({
    primaryColor: getThemeColor(), defaultOptions: props.defaultOptions || {}, currentUser: user, annotationPermissions: props.annotationPermissions, PDFViewerApplication: viewer, store,
    onTextSelected: (range) => { selectionBarRef.value?.open(range) },
    onAnnotationAdd: (annStore) => { emit('annotation-added', annStore) },
    onAnnotationDelete: (id) => { emit('annotation-deleted', id) },
    onAnnotationSelected: (annStore, isClick, selectorRect) => {
      emit('annotation-selected', annStore ?? null, isClick)
      if (annStore && isClick) {
        // Defer to nextTick to prevent the same native click event
        // from being caught by Radix Popover's DismissableLayer as an
        // "outside click" (PopoverContent hasn't rendered yet synchronously)
        nextTick(() => menuBarRef.value?.open(annStore, selectorRect))
      }
    },
    onAnnotationChanging: () => { menuBarRef.value?.close() },
    onAnnotationChanged: (annStore, selectorRect) => {
      if (annStore) emit('annotation-updated', annStore)
      if (annStore && selectorRect) {
        // Same defer logic to avoid Popover dismiss race on transformend
        nextTick(() => menuBarRef.value?.open(annStore, selectorRect))
      }
    },
  })
  painter = currentPainter

  store.setPainter(painter)
  selectionBarRef.value?.setPainterRef(painter)
  menuBarRef.value?.setMenuBarPainter(painter)

  const viewerElement = (viewer as any).viewer as HTMLDivElement
  if (viewerElement) painter.initWebSelection(viewerElement)

  const handlePageRendered = (evt: { pageNumber: number; source: any; cssTransform?: boolean }) => {
    if (!painter) return
    painter.initCanvas({ pageView: evt.source as any, cssTransform: !!evt.cssTransform, pageNumber: evt.pageNumber })
  }
  bus.on('pagerendered', handlePageRendered)

  const handleViewAreaChanged = () => { debouncedViewAreaChanged() }
  try { (bus as any)._on?.('updateviewarea', handleViewAreaChanged) } catch { bus.on('updateviewarea', handleViewAreaChanged) }

  let documentLoadStarted = false
  let rerenderTimer: ReturnType<typeof setTimeout> | null = null
  const handleDocumentLoaded = async () => {
    if (disposed || painter !== currentPainter || documentLoadStarted) return
    documentLoadStarted = true
    const resolvedAnnotations = (props.initialAnnotations || []) as IAnnotationStore[]
    try {
      await currentPainter.initAnnotationsOnce(resolvedAnnotations, !!props.enableNativeAnnotations)
    } catch (error) {
      if (!disposed && painter === currentPainter) console.error('Failed to initialize annotations.', error)
      return
    }
    if (disposed || painter !== currentPainter) return
    rerenderTimer = setTimeout(() => {
      rerenderTimer = null
      if (disposed || painter !== currentPainter) return
      for (let i = 0; i < viewer.pagesCount; i++) {
        const pageView = viewer.getPageView(i)
        if (pageView?.div && pageView.canvas && currentPainter.getKonvaCanvasStore()?.has(i + 1)) currentPainter.reRenderAnnotations(i + 1)
      }
    }, 0)
  }

  if (viewer.pdfDocument) handleDocumentLoaded()
  else bus.on('documentloaded', handleDocumentLoaded)

  cleanupEventHandlers = () => {
    if (rerenderTimer) clearTimeout(rerenderTimer)
    rerenderTimer = null
    bus.off('pagerendered', handlePageRendered)
    bus.off('updateviewarea', handleViewAreaChanged)
    try { (bus as any)._off?.('updateviewarea', handleViewAreaChanged) } catch { /* ignore */ }
    bus.off('documentloaded', handleDocumentLoaded)
  }
}

watch(() => pdfContext.isReady.value, (ready) => { if (ready && !painter) { store.clearAnnotations(); initPainter() } })
onMounted(() => { disposed = false; if (pdfContext.isReady.value) { store.clearAnnotations(); initPainter() } })

watch(
  [() => userContext?.user.value, () => props.annotationPermissions],
  ([user, permissions]) => {
    if (user) painter?.setPermissionContext(user, permissions)
  },
  { deep: true },
)

// Tool activation watcher
let lastActivatedType: number | null = null; let lastActivatedColor: string | null = null
watch(() => store.currentAnnotationType, (newType) => {
  if (!painter) return
  if (!newType) { lastActivatedType = null; lastActivatedColor = null; painter.activate(null, null); return }
  const newColor = newType.style?.color ?? null
  if (lastActivatedType === newType.type && lastActivatedColor === newColor && !store.dataTransfer) return
  lastActivatedType = newType.type; lastActivatedColor = newColor
  const dt = store.dataTransfer; store.setDataTransfer(null)
  painter.activate(newType, dt)
}, { immediate: false })

watch(() => pdfContext.isSidebarCollapsed.value, () => { debouncedViewAreaChanged() })

onUnmounted(() => { disposed = true; debouncedViewAreaChanged.cancel(); cleanupEventHandlers?.(); painter?.destroy(); painter = null; store.setPainter(null); lastActivatedType = null; lastActivatedColor = null })

defineExpose({
  getAnnotations: () => store.annotationList,
  save: () => emit('save', storesToAnnotations(store.annotationList)),
  selectTool: (tool: IAnnotationType | null, dataTransfer?: string | null) => { if (tool) currentTool = tool; painter?.activate(tool, dataTransfer ?? null) },
  getPainter: () => painter,
})
</script>
