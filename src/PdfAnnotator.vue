<template>
  <PdfViewerProvider
    :url="url"
    :data="data"
    :title="title"
    :layout-style="layoutStyle"
    :theme="theme"
    :initial-scale="initialScale"
    :user="user"
    :sidebar="sidebarPanels"
    :enable-range="enableRange"
    :default-active-sidebar-key="defaultActiveSidebarKey"
    :text-layer-mode="1"
    :annotation-mode="0"
    :external-link-target="0"
  >
    <template #toolbar>
      <AnnotationToolbar
        :colors="mergedOptions.colors"
        :signature-options="mergedOptions.signature"
        :stamp-options="mergedOptions.stamp"
        :annotation-permissions="annotationPermissions"
        :current-user="user"
      />
    </template>

    <!-- ====== Actions: slot overrides, or default Save + Export ====== -->
    <template v-if="hasActionSlot" #actions>
      <slot name="actions" :on-save="handleSaveFromPainter" :get-annotations="getAnnotations" :export-to-excel="handleExportExcelFromPainter" :export-to-pdf="handleExportPdf" />
    </template>
    <template v-else #actions>
      <div class="flex items-center gap-2">
        <Separator orientation="vertical" class="h-5 mx-1" />
        <!-- Export Dropdown -->
        <DropdownMenu>
          <template #trigger>
            <Button variant="outline" size="sm" class="h-8 gap-2">
              {{ t('common.export') }}
              <Icon name="downArrow" :size="8" />
            </Button>
          </template>
          <DropdownMenuItem @select="handleExportPdf()">
            {{ t('common.export') }} PDF
          </DropdownMenuItem>
          <DropdownMenuItem @select="handleExportExcelFromPainter()">
            {{ t('common.export') }} Excel
          </DropdownMenuItem>
        </DropdownMenu>
        <!-- Save Button -->
        <Button size="sm" class="h-8 gap-2" @click="handleSaveFromPainter">
          <Icon name="save" :size="16" />
          {{ t('common.save') }}
        </Button>
      </div>
    </template>

    <!-- Search sidebar -->
    <template #sidebar-search-sidebar>
      <SearchSidebar />
    </template>

    <!-- Annotation sidebar -->
    <template #sidebar-annotator-sidebar-toggle>
      <AnnotationSidebar
        :annotations="annotationList"
        :selected-id="selectedAnnotationId || undefined"
        :annotation-permissions="annotationPermissions"
        @select="handleSelectAnnotation"
      />
    </template>

    <!-- ====== AnnotatorExtension + ViewerExtension ====== -->
    <AnnotatorExtension
      ref="annotatorRef"
      :default-options="defaultOptions"
      :colors="mergedOptions.colors"
      :initial-annotations="effectiveAnnotations"
      :enable-native-annotations="enableNativeAnnotations"
      :annotation-permissions="annotationPermissions"
      :default-show-annotation-author-labels="defaultShowAnnotationAuthorLabels"
      @save="(a) => emit('save', storesToAnnotations(a))"
      @annotation-added="(a) => emit('annotationAdded', a as Annotation)"
      @annotation-deleted="(id) => emit('annotationDeleted', id)"
      @annotation-selected="handleAnnotationSelect"
      @annotation-updated="(a) => emit('annotationUpdated', a as Annotation)"
    />
    <ViewerExtension
      :on-document-loaded="onDocumentLoaded"
      :on-event-bus-ready="onEventBusReady"
    />
  </PdfViewerProvider>
</template>

<script setup lang="ts">
import { ref, computed, watch, useSlots, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import PdfViewerProvider from '@/context/PdfViewerProvider.vue'
import ViewerExtension from '@/extensions/viewer/ViewerExtension.vue'
import AnnotationToolbar from '@/extensions/annotator/components/toolbar/AnnotationToolbar.vue'
import SearchSidebar from '@/components/SearchSidebar.vue'
import AnnotationSidebar from '@/extensions/annotator/components/sidebar/AnnotationSidebar.vue'
import AnnotatorExtension from '@/components/annotator/AnnotatorExtension.vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import Icon from '@/components/Icon.vue'
import { useAnnotationStore } from '@/stores/annotationStore'
import { exportToExcel } from '@/composables/useExport'
import { exportAnnotationsToPdf } from '@/extensions/annotator/painter/annot'
import { annotationsToStores, storesToAnnotations } from '@/core/adapters/store.mapper'
import { deepMerge } from '@/utils'
import { defaultOptions as systemDefaults } from '@/extensions/annotator/const/default_options'
import i18n from '@/i18n'
import type { IAnnotationStore } from '@/extensions/annotator/const/definitions'
import type { PdfAnnotatorProps } from '@/extensions/annotator/types/annotator'
import type { Annotation } from '@/core/annotation.core'
import { useT } from '@/composables/useT'
const { t } = useT()

const props = withDefaults(defineProps<PdfAnnotatorProps>(), {
  title: 'PDF ANNOTATOR', locale: 'zh-CN', theme: 'violet',
  initialScale: 'auto', enableRange: 'auto',
  user: () => ({ id: 'null', name: 'unknown' }),
  enableNativeAnnotations: false, defaultShowAnnotationsSidebar: false,
  defaultShowAnnotationAuthorLabels: false,
})

const emit = defineEmits<{
  save: [annotations: Annotation[]]
  load: []
  annotationAdded: [annotation: Annotation]
  annotationDeleted: [id: string]
  annotationSelected: [annotation: Annotation | null, isClick: boolean]
  annotationUpdated: [annotation: Annotation]
}>()

const slots = useSlots()
const store = useAnnotationStore()
const { annotationList } = storeToRefs(store)

const annotatorRef = ref<InstanceType<typeof AnnotatorExtension> | null>(null)
const selectedAnnotationId = ref<string | null>(null)

// 1) i18n locale change — align React useEffect
watch(() => props.locale, (loc) => { (i18n as any).global.locale.value = loc }, { immediate: true })

// Store reset on unmount (prevents state leak across tabs)
onUnmounted(() => {
  store.clearAnnotations()
  store.setCurrentAnnotationType(null)
  store.clearSelectedAnnotation()
  store.setDataTransfer(null)
})

// 2) Sidebar panels — align React key names
const sidebarPanels = [
  { key: 'search-sidebar', title: 'Search', icon: 'search' },
  { key: 'annotator-sidebar-toggle', title: 'Annotations', icon: 'annotations' },
]
const defaultActiveSidebarKey = computed(() =>
  props.defaultShowAnnotationsSidebar ? 'annotator-sidebar-toggle' : null
)

// 3) Annotation[] → IAnnotationStore[] conversion (align React annotationsToStores call)
const effectiveAnnotations = computed(() => annotationsToStores(props.initialAnnotations || []))

// 3b) Merge user options with system defaults (align React useMemo deepMerge)
const mergedOptions = computed(() => deepMerge(systemDefaults, props.defaultOptions || {}))

// 4) Slot presence detection
const hasActionSlot = computed(() => !!slots.actions)

// ====== Actions (default: Save + Export) ======
function getAnnotations(): Annotation[] { return storesToAnnotations(annotationList.value) }
function handleSaveFromPainter() { emit('save', storesToAnnotations(annotationList.value)) }
function handleExportExcelFromPainter(name?: string) { exportToExcel(annotationList.value, name) }
async function handleExportPdf(name?: string) {
  const p = annotatorRef.value?.getPainter?.()
  const viewer = p?.getPDFViewer?.()
  if (p && viewer) {
    await exportAnnotationsToPdf(viewer as any, p.getData(), name)
  }
}

// ====== Annotation selection ======
function handleAnnotationSelect(ann: IAnnotationStore | null, isClick: boolean) {
  selectedAnnotationId.value = ann?.id || null
  emit('annotationSelected', ann as unknown as Annotation, isClick)
}
function handleSelectAnnotation(ann: IAnnotationStore) { selectedAnnotationId.value = ann.id }

// ====== Document loaded callback ======
function onDocumentLoaded(_viewer: any) { emit('load') }
function onEventBusReady(_bus: any) { /* exposed for advanced use */ }

defineExpose({ save: handleSaveFromPainter, getAnnotations })
</script>
