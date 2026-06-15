// PDF Viewer context — Vue 3 provide/inject

import type { InjectionKey, Ref, ShallowRef, ComputedRef } from 'vue'
import type { User } from '@/types'

export type SidebarPanelKey = string

export interface SidebarPanel {
  key: SidebarPanelKey
  title: string
  icon: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PDFRef = Ref<any>

export interface PdfViewerContextValue {
  pdfDocument: PDFRef
  pdfViewer: PDFRef
  eventBus: PDFRef
  viewerContainerRef: Readonly<ShallowRef<HTMLDivElement | null>>
  isReady: Ref<boolean>
  activeSidebarPanel: Ref<SidebarPanelKey | null>
  toggleSidebar: () => void
  openSidebar: (key: SidebarPanelKey) => void
  closeSidebar: () => void
  isSidebarCollapsed: Ref<boolean>
  print: () => void
  download: (fileName?: string) => void
}

export interface UserContextValue {
  user: ComputedRef<User | null>
}

export const PdfViewerContextKey: InjectionKey<PdfViewerContextValue> = Symbol('PdfViewerContext')
export const UserContextKey: InjectionKey<UserContextValue> = Symbol('UserContext')
