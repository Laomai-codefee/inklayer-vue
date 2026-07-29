import { createPinia, setActivePinia } from 'pinia'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnnotationStore } from '@/stores/annotationStore'
import type { PdfAnnotatorOptions } from '../../types/annotator'
import { Painter } from '..'

describe('Painter annotation hover', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function createPainter() {
    return new Painter({
      primaryColor: '#6e56cf',
      defaultOptions: {} as PdfAnnotatorOptions,
      currentUser: { id: 'alice', name: 'Alice' },
      defaultShowAnnotationAuthorLabels: false,
      PDFViewerApplication: {} as PDFViewer,
      store: useAnnotationStore(),
      onTextSelected: vi.fn(),
      onAnnotationAdd: vi.fn(),
      onAnnotationDelete: vi.fn(),
      onAnnotationSelected: vi.fn(),
      onAnnotationChanging: vi.fn(),
      onAnnotationChanged: vi.fn(),
    })
  }

  it('routes passive hover only to labels and publishes an empty state on destroy', () => {
    const painter = createPainter()
    const internals = painter as unknown as {
      authorLabels: { setHovered: (id: string | null) => void }
      hoverPreview: { setHovered: (id: string | null) => void }
    }
    const setLabelHovered = vi.spyOn(internals.authorLabels, 'setHovered')
    const setPreviewHovered = vi.spyOn(internals.hoverPreview, 'setHovered')
    const listener = vi.fn()
    painter.subscribeAnnotationHover(listener)

    painter.setAnnotationHover('canvas-passive', 'annotation-1')
    expect(setLabelHovered).toHaveBeenLastCalledWith('annotation-1')
    expect(setPreviewHovered).toHaveBeenLastCalledWith(null)

    painter.setAnnotationHover('sidebar-pointer', 'annotation-1')
    expect(setPreviewHovered).toHaveBeenLastCalledWith('annotation-1')

    painter.clearAnnotationHover('sidebar-pointer', 'annotation-1')
    expect(setLabelHovered).toHaveBeenLastCalledWith('annotation-1')
    expect(setPreviewHovered).toHaveBeenLastCalledWith(null)

    painter.destroy()
    expect(listener).toHaveBeenLastCalledWith({
      annotationId: null,
      source: null,
    })
  })
})
