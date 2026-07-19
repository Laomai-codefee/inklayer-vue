/**
 * InkLayer Vue — PDF Annotation Component Library
 * ================================================
 * Top-level exports: PdfViewer, PdfAnnotator, and supporting types
 */

import './assets/tailwind.css'
import { createPinia, getActivePinia } from 'pinia'
import type { App } from 'vue'

/**
 * Vue Plugin that automatically installs Pinia if the consumer
 * hasn't already done so. Use `app.use(inklayerVuePlugin)` in
 * your main.ts to get started with zero config.
 */
export const inklayerVuePlugin = {
  install(app: App) {
    if (!getActivePinia()) {
      app.use(createPinia())
    }
  },
}

// ========== Top-level Components ==========
export { default as PdfViewer } from './PdfViewer.vue'
export { default as PdfAnnotator } from './PdfAnnotator.vue'

// ========== Context Provider (advanced use) ==========
export { default as PdfViewerProvider } from './context/PdfViewerProvider.vue'

// ========== Extension Components ==========
export { default as AnnotatorExtension } from './components/annotator/AnnotatorExtension.vue'
export { default as AnnotationToolbar } from './extensions/annotator/components/toolbar/AnnotationToolbar.vue'
export { default as ZoomTool } from './extensions/annotator/components/toolbar/ZoomTool.vue'
export { default as ColorPicker } from './extensions/annotator/components/toolbar/ColorPicker.vue'
export { default as AnnotationSidebar } from './extensions/annotator/components/sidebar/AnnotationSidebar.vue'
export { default as SearchSidebar } from './components/SearchSidebar.vue'
export { default as AnnotationIcon } from './components/Icon.vue'

// ========== shadcn-vue UI Components ==========
export { default as Button } from './components/ui/button/Button.vue'
export { buttonVariants } from './components/ui/button/variants'
export type { ButtonVariants } from './components/ui/button/variants'
export { default as Tabs } from './components/ui/tabs/Tabs.vue'
export { default as TabsList } from './components/ui/tabs/TabsList.vue'
export { default as TabsTrigger } from './components/ui/tabs/TabsTrigger.vue'
export { default as TabsContent } from './components/ui/tabs/TabsContent.vue'
export { default as Tooltip } from './components/ui/tooltip/Tooltip.vue'
export { default as Popover } from './components/ui/popover/Popover.vue'
export { default as Separator } from './components/ui/separator/Separator.vue'
export { default as Input } from './components/ui/input/Input.vue'
export { default as ScrollArea } from './components/ui/scroll-area/ScrollArea.vue'
export { default as Textarea } from './components/ui/textarea/Textarea.vue'
export { default as Card } from './components/ui/card/Card.vue'
export { default as CardHeader } from './components/ui/card/CardHeader.vue'
export { default as CardTitle } from './components/ui/card/CardTitle.vue'
export { default as CardDescription } from './components/ui/card/CardDescription.vue'
export { default as CardContent } from './components/ui/card/CardContent.vue'
export { default as CardFooter } from './components/ui/card/CardFooter.vue'

// ========== Composables ==========
export { usePdfViewer } from './composables/usePdfViewer'
export type { UseViewerOptions } from './composables/usePdfViewer'
export { usePdfTool } from './composables/usePdfTool'
export { usePdfSearch } from './composables/usePdfSearch'
export { useSystemAppearance } from './composables/useSystemAppearance'
export { exportToExcel } from './composables/useExport'

// ========== Context ==========
export {
  PdfViewerContextKey,
  UserContextKey,
  type PdfViewerContextValue,
  type SidebarPanelKey,
  type SidebarPanel,
} from './context/pdfViewerContext'

// ========== Types ==========
export type { MatchSnippet, PageMatch, KeywordResult, User, PdfScale, PdfBaseProps } from './types'
export type { PdfViewerProps } from './types/viewer'
export type { DeepPartial } from './types/utils'
export type {
  PdfAnnotatorProps,
  PdfAnnotatorOptions,
  AnnotationPermissionAction,
  AnnotationPermissionMode,
  AnnotationPermissionRequest,
  AnnotationPermissions,
} from './extensions/annotator/types/annotator'
export type { IAnnotationStore, IAnnotationComment } from './extensions/annotator/const/definitions'

// ========== Core ==========
export * from './core'

// ========== Stores ==========
export { useAnnotationStore } from './stores/annotationStore'

// ========== Lib Utils ==========
export { cn } from './lib/utils'
