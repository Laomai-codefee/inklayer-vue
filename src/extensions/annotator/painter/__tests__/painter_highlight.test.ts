import { afterEach, describe, expect, it, vi } from 'vitest'

import { Painter } from '..'
import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
} from '../../const/definitions'

function makeAnnotation(id: string, pageNumber: number): IAnnotationStore {
  return {
    id,
    referenceNumber: pageNumber,
    pageNumber,
    konvaString: '{}',
    konvaClientRect: { x: 10, y: 20, width: 20, height: 20 },
    title: 'Alice',
    type: AnnotationType.RECTANGLE,
    color: '#000000',
    subtype: 'Square',
    pdfjsType: PdfjsAnnotationType.SQUARE,
    date: null,
    contentsObj: { text: '' },
    comments: [],
    user: { id: 'alice', name: 'Alice' },
    native: false,
  }
}

function createPainter() {
  const painter = Object.create(Painter.prototype) as Painter
  const findEditor = vi.fn((pageNumber: number) =>
    pageNumber === 2 ? {} : undefined
  )
  const select = vi.fn()
  const getPageView = vi.fn(() => undefined)
  const scrollPageIntoView = vi.fn()

  Object.assign(painter as unknown as Record<string, unknown>, {
    highlightRequestId: 0,
    highlightRetryTimer: null,
    resolveHighlightRequest: null,
    currentAnnotation: null,
    pdfViewerApplication: {
      _pages: [],
      getPageView,
      scrollPageIntoView,
    },
    findEditor,
    setDefaultMode: vi.fn(),
    selector: { select, activate: vi.fn() },
  })

  return { painter, findEditor, select, getPageView, scrollPageIntoView }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Painter highlight navigation', () => {
  it('cancels an older pending navigation when a newer target is activated', async () => {
    vi.useFakeTimers()
    const { painter, select, getPageView, scrollPageIntoView } = createPainter()

    const first = painter.highlight(makeAnnotation('annotation-1', 1))
    const second = painter.highlight(makeAnnotation('annotation-2', 2))

    await expect(first).resolves.toBe(false)
    await expect(second).resolves.toBe(true)
    expect(select).toHaveBeenCalledTimes(1)
    expect(select).toHaveBeenCalledWith('annotation-2')
    expect(getPageView).toHaveBeenNthCalledWith(1, 0)
    expect(getPageView).toHaveBeenNthCalledWith(2, 1)
    expect(scrollPageIntoView).toHaveBeenLastCalledWith({ pageNumber: 2 })
    expect(vi.getTimerCount()).toBe(0)
  })
})
