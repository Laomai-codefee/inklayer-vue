<template>
  <div
    id="InkLayer"
    class="flex flex-col h-full w-full relative"
    :style="fullContainerStyle"
  >
    <!-- ========== Loading overlay (delayed) ========== -->
    <div
      v-if="showLoading"
      class="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm"
    >
      <svg class="animate-spin size-8 text-muted-foreground" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="mt-4 text-sm font-medium text-muted-foreground">{{ t('common.loading') }} {{ progress }}%</span>
    </div>

    <!-- ========== Top progress bar (transient) ========== -->
    <div
      v-if="progressBarVisible"
      class="absolute top-0 left-0 h-0.5 bg-primary z-[110] transition-all duration-500 ease-out"
      :style="{ width: progressBarValue + '%' }"
    />

    <!-- ========== Error banner ========== -->
    <div v-if="loadError" class="absolute top-2 left-1/2 -translate-x-1/2 z-50">
      <Card class="bg-destructive/10 border-destructive/50 shadow-lg">
        <CardContent class="p-3 text-xs text-destructive">{{ loadError.message }}</CardContent>
      </Card>
    </div>

    <!-- ========== Header: white bg + subtle border (React: bg-color + border-color) ========== -->
    <header class="flex items-center justify-between h-[45px] px-3 bg-background border-b border-border shrink-0 gap-3">
      <span class="text-sm font-medium truncate">{{ title || 'PDF Viewer' }}</span>
      <div class="flex items-center gap-2">
        <div v-if="sidebar && sidebar.length" class="flex gap-1">
          <Button
            v-for="panel in sidebar"
            :key="panel.key"
            variant="ghost" size="icon" class="size-8"
            :class="{ 'bg-accent text-accent-foreground': activeSidebarPanel === panel.key }"
            @click="toggleSidebarPanel(panel.key)"
          >
            <Icon :name="panel.icon" :size="18" />
          </Button>
        </div>
        <slot name="actions" :context="contextValue" />
      </div>
    </header>

    <!-- ========== Body ========== -->
    <div class="flex flex-1 min-h-0">
      <div class="flex flex-col flex-1 min-w-0">
        <!-- Toolbar: scrollable with Radix ScrollArea -->
        <div v-if="hasToolbar" class="shrink-0 border-b border-border bg-secondary shadow-sm h-10 w-full">
          <ScrollArea class="h-full w-full" type="auto">
            <div class="flex items-center h-full gap-2 px-2 justify-center min-w-max mt-1">
              <slot name="toolbar" :context="contextValue" />
            </div>
          </ScrollArea>
        </div>

        <!-- PDF area: muted gray bg to distinguish white pages (React: bg-color-secondary) -->
        <div class="flex-1 relative overflow-hidden bg-muted">
          <PageIndicator />

          <!-- PDF viewer container -->
          <div ref="viewerContainerRef" style="position: absolute" class="inset-0 overflow-auto flex justify-center p-6">
            <div class="pdfViewer min-w-full" />
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <aside v-if="activePanel" class="w-80 shrink-0 border-l bg-muted/30 overflow-y-auto p-1">
        <slot :name="`sidebar-${activePanel.key}`" :context="contextValue" />
      </aside>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, watch, shallowRef, type CSSProperties, useSlots, onUnmounted, onMounted } from 'vue'
import '@/styles/pdf_viewer.css'
import { useT } from '@/composables/useT'
import { ScrollArea } from '@/components/ui/scroll-area'

const { t } = useT()
import { usePdfViewer, type UseViewerOptions } from '@/composables/usePdfViewer'
import { usePdfTool } from '@/composables/usePdfTool'
import { PdfViewerContextKey, UserContextKey, type PdfViewerContextValue, type SidebarPanelKey } from '@/context/pdfViewerContext'
import type { PdfScale, User } from '@/types'
import { Button } from '@/components/ui/button'
import Icon from '@/components/Icon.vue'
import { Card, CardContent } from '@/components/ui/card'
import PageIndicator from '@/components/PageIndicator.vue'

interface Props extends Omit<UseViewerOptions, 'eventBus'> {
  title?: string
  toolbar?: boolean
  sidebar?: { key: string; title: string; icon: string }[]
  defaultActiveSidebarKey?: SidebarPanelKey | null
  /** Container CSS — aligned with PdfBaseProps.layoutStyle */
  layoutStyle?: CSSProperties
  theme?: string
  initialScale?: PdfScale
  user?: User | null
}

const props = withDefaults(defineProps<Props>(), {
  title: 'PDF Viewer', sidebar: () => [], defaultActiveSidebarKey: null,
  layoutStyle: () => ({}), theme: 'violet', initialScale: 'auto',
  user: null, toolbar: true,
})

// Theme → overrides --color-primary on :root (align React getThemeColor)
// Must use setProperty(..., 'important') to override Tailwind v4's @theme :root definition
// Colors match radix-ui accent-9 values (same as react PdfBaseProps.theme union)
const themePrimaryColors: Record<string, string> = {
  ruby: 'hsl(348, 99%, 54%)',
  indigo: 'hsl(226, 70%, 55%)',
  gray: 'hsl(220, 6%, 46%)',
  gold: 'hsl(36, 77%, 52%)',
  bronze: 'hsl(17, 20%, 54%)',
  brown: 'hsl(28, 44%, 47%)',
  yellow: 'hsl(53, 100%, 50%)',
  amber: 'hsl(32, 95%, 44%)',
  orange: 'hsl(24, 100%, 50%)',
  tomato: 'hsl(10, 84%, 56%)',
  red: 'hsl(0, 72%, 51%)',
  crimson: 'hsl(336, 80%, 57%)',
  pink: 'hsl(322, 81%, 57%)',
  plum: 'hsl(292, 70%, 50%)',
  purple: 'hsl(270, 68%, 55%)',
  violet: 'hsl(262, 83%, 58%)',
  iris: 'hsl(240, 72%, 65%)',
  blue: 'hsl(221, 83%, 53%)',
  cyan: 'hsl(189, 79%, 46%)',
  teal: 'hsl(174, 64%, 40%)',
  jade: 'hsl(164, 75%, 38%)',
  green: 'hsl(142, 76%, 36%)',
  grass: 'hsl(131, 47%, 46%)',
  lime: 'hsl(110, 62%, 54%)',
  mint: 'hsl(162, 81%, 71%)',
  sky: 'hsl(193, 98%, 54%)',
}

let themeStyleEl: HTMLStyleElement | null = null

function applyTheme(themeName: string | undefined) {
  const color = themePrimaryColors[themeName ?? 'violet'] ?? themePrimaryColors.violet
  // Remove old style element if exists
  if (themeStyleEl) { themeStyleEl.remove(); themeStyleEl = null }
  // Inject <style> with !important — reliably overrides Tailwind v4 @theme
  themeStyleEl = document.createElement('style')
  themeStyleEl.id = 'inklayer-theme-override'
  themeStyleEl.textContent = `#InkLayer { --color-primary: ${color} !important; --color-ring: ${color} !important; }
:root { --inklayer-primary: ${color} !important; --inklayer-ring: ${color} !important; }`
  document.head.appendChild(themeStyleEl)
}

watch(() => props.theme, (t) => applyTheme(t), { immediate: true })
onUnmounted(() => {
  if (themeStyleEl) { themeStyleEl.remove(); themeStyleEl = null }
})

const fullContainerStyle = computed(() => props.layoutStyle)

const slots = useSlots()
const viewerContainerRef = shallowRef<HTMLDivElement | null>(null)
const activeSidebarPanel = ref<SidebarPanelKey | null>(props.defaultActiveSidebarKey)

// PDF viewer
const { loading, progress, pdfDocument, pdfViewer, eventBus, loadError } = usePdfViewer(viewerContainerRef, {
  url: props.url, data: props.data, enableRange: props.enableRange,
  textLayerMode: props.textLayerMode, annotationMode: props.annotationMode,
  externalLinkTarget: props.externalLinkTarget,
  onLoadSuccess: props.onLoadSuccess, onLoadError: props.onLoadError,
  onLoadEnd: props.onLoadEnd, onViewerInit: props.onViewerInit,
})

const { printClean, downloadClean } = usePdfTool(pdfDocument)

// ========== Loading state (React-aligned: delayed overlay + transient progress) ==========
const LOADING_DELAY = 500
const PROGRESS_HIDE_DELAY = 1500

// Delayed loading overlay
const showLoading = ref(false)
let loadingDelayTimer: ReturnType<typeof setTimeout> | null = null

watch(loading, (val) => {
  if (val) {
    loadingDelayTimer = setTimeout(() => { showLoading.value = true }, LOADING_DELAY)
  } else {
    if (loadingDelayTimer) { clearTimeout(loadingDelayTimer); loadingDelayTimer = null }
    showLoading.value = false
  }
}, { immediate: true })

// Transient progress bar
const progressBarVisible = ref(false)
const progressBarValue = ref(0)
let progressHideTimer: ReturnType<typeof setTimeout> | null = null
let lastProgress = 0

watch(progress, (val) => {
  if (val === lastProgress) return
  lastProgress = val
  progressBarValue.value = val

  if (!progressBarVisible.value) progressBarVisible.value = true
  if (progressHideTimer) clearTimeout(progressHideTimer)

  progressHideTimer = setTimeout(() => {
    progressBarVisible.value = false
    progressHideTimer = null
  }, PROGRESS_HIDE_DELAY)
})

onUnmounted(() => {
  if (loadingDelayTimer) clearTimeout(loadingDelayTimer)
  if (progressHideTimer) clearTimeout(progressHideTimer)
})

// ========== Sidebar ==========
const activePanel = computed(() => {
  if (!props.sidebar?.length || !activeSidebarPanel.value) return null
  return props.sidebar.find(p => p.key === activeSidebarPanel.value) || null
})

function toggleSidebarPanel(key: SidebarPanelKey) {
  activeSidebarPanel.value = activeSidebarPanel.value === key ? null : key
}
function openSidebar(key: SidebarPanelKey) { activeSidebarPanel.value = key }
function closeSidebar() { activeSidebarPanel.value = null }
function toggleSidebar() {
  activeSidebarPanel.value = activeSidebarPanel.value ? null : props.sidebar?.[0]?.key ?? null
}
const isSidebarCollapsed = computed(() => activeSidebarPanel.value === null)

watch(() => props.sidebar, (newVal) => {
  if (!newVal?.length || !activeSidebarPanel.value) return
  if (!newVal.some(p => p.key === activeSidebarPanel.value)) activeSidebarPanel.value = null
})

watch([pdfViewer, eventBus], ([viewer, bus]) => {
  if (!viewer || !bus) return
  const handler = () => { viewer.currentScaleValue = props.initialScale || 'auto' }
  bus.on('pagesloaded', handler)
  return () => bus.off('pagesloaded', handler)
})

watch([pdfViewer, eventBus], ([viewer, bus]) => {
  if (!viewer || !bus) return
  const handleResize = () => {
    const sv = viewer.currentScaleValue
    if (sv === 'auto' || sv === 'page-fit' || sv === 'page-width') viewer.currentScaleValue = sv
    viewer.update()
  }
  window.addEventListener('resize', handleResize)
  handleResize()
  return () => window.removeEventListener('resize', handleResize)
})

watch(isSidebarCollapsed, () => {
  if (eventBus.value && pdfViewer.value) eventBus.value.dispatch('updateviewarea', {})
})

// ========== Context ==========
const isReady = computed(() => !!(pdfViewer.value && eventBus.value && viewerContainerRef.value && !loading.value))

const contextValue: PdfViewerContextValue = {
  pdfDocument, pdfViewer, eventBus, viewerContainerRef, isReady,
  activeSidebarPanel, toggleSidebar, openSidebar, closeSidebar, isSidebarCollapsed,
  print: () => printClean(), download: (name) => downloadClean(name),
}

provide(PdfViewerContextKey, contextValue)
provide(UserContextKey, { user: computed(() => props.user || null) })

const hasToolbar = computed(() => slots.toolbar)

// ========== Mount/unmount: toggle body class for CSS scoping ==========
onMounted(() => document.body.classList.add('inklayer-app'))
onUnmounted(() => document.body.classList.remove('inklayer-app'))
</script>
