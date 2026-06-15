<template>
  <PdfViewerProvider
    :url="url"
    :data="data"
    :title="title"
    :initial-scale="initialScale"
    :layout-style="layoutStyle"
    :theme="theme"
    :sidebar="allSidebarPanels"
    :default-active-sidebar-key="defaultActiveSidebarKey"
    :enable-range="enableRange"
    :text-layer-mode="showTextLayer ? 1 : 0"
    :annotation-mode="showAnnotations ? 1 : 0"
    :external-link-target="0"
    :user="null"
  >
    <!-- ====== Toolbar: ZoomTool always first, user slot appended (or just ZoomTool) ====== -->
    <template v-if="hasToolbarSlot" #toolbar="scope">
      <div class="flex items-center gap-3">
        <ZoomTool />
        <Separator orientation="vertical" class="h-6" />
        <slot name="toolbar" v-bind="scope" />
      </div>
    </template>
    <template v-else #toolbar>
      <ToolbarRenderer :toolbar="toolbar" />
    </template>

    <!-- ====== Actions: user slot overrides prop ====== -->
    <template v-if="hasActionSlot" #actions="scope">
      <slot name="actions" v-bind="scope" />
    </template>
    <template v-else #actions>
      <ActionsRenderer :actions="(actions as any)" />
    </template>

    <!-- ====== Search sidebar: always forward (with SearchSidebar default) ====== -->
    <template #sidebar-search-sidebar="scope">
      <slot name="sidebar-search-sidebar" v-bind="scope">
        <SearchSidebar />
      </slot>
    </template>

    <!-- ====== Custom sidebar panels: forward user slots for each non-search panel ====== -->
    <template
      v-for="panel in customSidebarPanels"
      :key="panel.key"
      #[`sidebar-${panel.key}`]="scope"
    >
      <slot :name="`sidebar-${panel.key}`" v-bind="scope" />
    </template>

    <!-- ====== ViewerExtension as child ====== -->
    <ViewerExtension
      :on-document-loaded="(viewer) => emit('documentLoaded', viewer)"
      :on-event-bus-ready="(bus) => emit('eventBusReady', bus)"
    />
  </PdfViewerProvider>
</template>

<script setup lang="ts">
import { computed, watch, useSlots } from 'vue'
import PdfViewerProvider from '@/context/PdfViewerProvider.vue'
import ViewerExtension from '@/extensions/viewer/ViewerExtension.vue'
import ZoomTool from '@/extensions/annotator/components/toolbar/ZoomTool.vue'
import { Separator } from '@/components/ui/separator'
import ToolbarRenderer from './ToolbarRenderer.vue'
import ActionsRenderer from './ActionsRenderer.vue'
import SearchSidebar from '@/components/SearchSidebar.vue'
import i18n from '@/i18n'
import type { PdfViewerProps } from '@/types/viewer'
import type { SidebarPanel } from '@/context/pdfViewerContext'

const props = withDefaults(defineProps<PdfViewerProps>(), {
  title: 'PDF VIEWER', locale: 'zh-CN', theme: 'violet',
  initialScale: 'auto', enableRange: 'auto',
  showTextLayer: true, showAnnotations: false, defaultActiveSidebarKey: null,
})

const emit = defineEmits<{
  documentLoaded: [viewer: any]
  eventBusReady: [bus: any]
}>()

const slots = useSlots()

// 1) i18n locale — align React useEffect(() => i18n.changeLanguage(locale), [locale])
watch(() => props.locale, (loc) => { (i18n as any).global.locale.value = loc }, { immediate: true })

// 2) Sidebar: search-sidebar always first, then user panels
const searchPanel: SidebarPanel = { key: 'search-sidebar', title: 'Search', icon: 'search' }
const allSidebarPanels = computed(() => {
  const panels = [searchPanel, ...(props.sidebar || [])]
  const seen = new Set<string>()
  return panels.filter((p) => { if (seen.has(p.key)) return false; seen.add(p.key); return true })
})

// Non-search custom panels (for slot forwarding)
const customSidebarPanels = computed(() => (props.sidebar || []).filter(p => p.key !== 'search-sidebar'))

// 3) Slot presence detection — user can override via slots instead of props
const hasToolbarSlot = computed(() => !!slots.toolbar)
const hasActionSlot = computed(() => !!slots.actions)
</script>
