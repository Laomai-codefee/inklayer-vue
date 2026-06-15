/**
 * PdfViewer Props — Vue 3 version, aligned with React PdfViewerProps
 */
import type { Component } from 'vue'
import type { PdfBaseProps } from './index'
import type { PdfViewerContextValue, SidebarPanel, SidebarPanelKey } from '@/context/pdfViewerContext'

export interface PdfViewerProps extends PdfBaseProps {
  /** Custom actions area (replaces default Print button) */
  actions?: Component | ((ctx: PdfViewerContextValue) => Component) | null

  /** Custom sidebar panels (search sidebar always included first) */
  sidebar?: SidebarPanel[]

  /** Custom toolbar (ZoomTool always shown first, user content appended after separator) */
  toolbar?: Component | ((ctx: PdfViewerContextValue) => Component)

  /** Show text layer for selection/search */
  showTextLayer?: boolean

  /** Show native PDF annotations */
  showAnnotations?: boolean

  /** Default active sidebar key */
  defaultActiveSidebarKey?: SidebarPanelKey | null

  /** Document loaded callback */
  onDocumentLoaded?: (pdfViewer: any) => void

  /** EventBus ready callback */
  onEventBusReady?: (bus: any) => void
}
