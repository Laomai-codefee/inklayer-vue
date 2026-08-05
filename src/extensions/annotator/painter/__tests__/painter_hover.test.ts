import { createPinia, setActivePinia } from 'pinia'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnnotationStore } from '@/stores/annotationStore'
import { AnnotationType, annotationDefinitions } from '../../const/definitions'
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

  it('routes Canvas hover only to labels and publishes an empty state on destroy', () => {
    const painter = createPainter()
    const internals = painter as unknown as {
      authorLabels: { setHovered: (id: string | null) => void }
      hoverPreview: { setHovered: (id: string | null) => void }
    }
    const setLabelHovered = vi.spyOn(internals.authorLabels, 'setHovered')
    const setPreviewHovered = vi.spyOn(internals.hoverPreview, 'setHovered')
    const listener = vi.fn()
    painter.subscribeAnnotationHover(listener)

    painter.setAnnotationHover('canvas', 'annotation-1')
    expect(setLabelHovered).toHaveBeenLastCalledWith('annotation-1')
    expect(setPreviewHovered).toHaveBeenLastCalledWith(null)

    painter.clearAnnotationHover('canvas', 'annotation-1')
    expect(setLabelHovered).toHaveBeenLastCalledWith(null)
    expect(setPreviewHovered).toHaveBeenLastCalledWith(null)

    painter.setAnnotationHover('canvas-passive', 'annotation-1')
    expect(setLabelHovered).toHaveBeenLastCalledWith('annotation-1')
    expect(setPreviewHovered).toHaveBeenLastCalledWith(null)

    painter.destroy()
    expect(listener).toHaveBeenLastCalledWith({
      annotationId: null,
      source: null,
    })
  })

  it('keeps passive hover available while a text-markup tool is active', () => {
    const painter = createPainter()
    const internals = painter as unknown as {
      passiveHover: { shouldSuppress: () => boolean }
      webSelection: { isRangeSelectionActive: () => boolean }
    }
    const highlight = annotationDefinitions.find(
      annotation => annotation.type === AnnotationType.HIGHLIGHT,
    )!
    const rectangle = annotationDefinitions.find(
      annotation => annotation.type === AnnotationType.RECTANGLE,
    )!

    painter.activate(highlight, null)
    expect(internals.passiveHover.shouldSuppress()).toBe(false)

    const rangeSelectionSpy = vi
      .spyOn(internals.webSelection, 'isRangeSelectionActive')
      .mockReturnValue(true)
    expect(internals.passiveHover.shouldSuppress()).toBe(true)

    rangeSelectionSpy.mockRestore()
    painter.activate(rectangle, null)
    expect(internals.passiveHover.shouldSuppress()).toBe(true)

    painter.destroy()
  })
})
