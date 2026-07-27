import { ref, shallowRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { PdfViewerContextKey, type PdfViewerContextValue } from '@/context/pdfViewerContext'
import PdfOutline from '../PdfOutline.vue'

function createOutlineItem(title: string, overrides: Record<string, unknown> = {}) {
  return {
    title,
    dest: null,
    url: null,
    unsafeUrl: undefined,
    newWindow: false,
    bold: false,
    italic: false,
    color: new Uint8ClampedArray([0, 0, 0]),
    count: 0,
    items: [],
    ...overrides,
  }
}

function mountOutline(document: any, viewer: any) {
  const context: PdfViewerContextValue = {
    pdfDocument: ref(document),
    pdfViewer: ref(viewer),
    eventBus: ref(null),
    viewerContainerRef: shallowRef(null),
    isReady: ref(true),
    activeSidebarPanel: ref(null),
    toggleSidebar: vi.fn(), openSidebar: vi.fn(), closeSidebar: vi.fn(),
    isSidebarCollapsed: ref(true), print: vi.fn(), download: vi.fn(),
  }
  return { context, wrapper: mount(PdfOutline, {
    global: { provide: { [PdfViewerContextKey as symbol]: context } },
  }) }
}

describe('PdfOutline', () => {
  it('shows the empty state', async () => {
    const document = { getOutline: vi.fn(async () => []), numPages: 1 }
    const { wrapper } = mountOutline(document, { pdfDocument: document })
    await flushPromises()
    expect(wrapper.get('.outline-state').text()).not.toBe('')
  })

  it('navigates integer, named, and cached reference destinations', async () => {
    const reference = { num: 7, gen: 0 }
    const items = [
      createOutlineItem('Integer', { dest: [1, { name: 'XYZ' }] }),
      createOutlineItem('Named', { dest: 'chapter' }),
      createOutlineItem('Reference', { dest: [reference, { name: 'Fit' }] }),
    ]
    const document = {
      getOutline: vi.fn(async () => items),
      getDestination: vi.fn(async () => [2, { name: 'Fit' }]),
      cachedPageNumber: vi.fn(() => 4),
      getPageIndex: vi.fn(),
      numPages: 10,
    }
    const viewer = { pdfDocument: document, scrollPageIntoView: vi.fn() }
    const { wrapper } = mountOutline(document, viewer)
    await flushPromises()

    await wrapper.findAll('.outline-title')[0].trigger('click')
    expect(viewer.scrollPageIntoView).toHaveBeenLastCalledWith({
      pageNumber: 2,
      destArray: items[0].dest,
    })

    await wrapper.findAll('.outline-title')[1].trigger('click')
    await flushPromises()
    expect(document.getDestination).toHaveBeenCalledWith('chapter')
    expect(viewer.scrollPageIntoView).toHaveBeenLastCalledWith({
      pageNumber: 3,
      destArray: [2, { name: 'Fit' }],
    })

    await wrapper.findAll('.outline-title')[2].trigger('click')
    await flushPromises()
    expect(viewer.scrollPageIntoView).toHaveBeenLastCalledWith({
      pageNumber: 4,
      destArray: items[2].dest,
    })
    expect(wrapper.findAll('.outline-title')[2].attributes('aria-current')).toBe('location')
    expect(wrapper.findAll('.outline-title')[2].classes()).toContain('bg-primary/15')
    expect(wrapper.findAll('.outline-title')[2].classes()).not.toContain('bg-transparent')
  })

  it('ignores a named destination that resolves after the document changes', async () => {
    let resolveDestination!: (value: unknown[]) => void
    const oldDocument = {
      getOutline: vi.fn(async () => [createOutlineItem('Old', { dest: 'old' })]),
      getDestination: vi.fn(() => new Promise(resolve => { resolveDestination = resolve })),
      cachedPageNumber: vi.fn(),
      getPageIndex: vi.fn(),
      numPages: 2,
    }
    const viewer: any = { pdfDocument: oldDocument, scrollPageIntoView: vi.fn() }
    const { context, wrapper } = mountOutline(oldDocument, viewer)
    await flushPromises()
    await wrapper.get('.outline-title').trigger('click')

    const newDocument = {
      getOutline: vi.fn(async () => []),
      numPages: 1,
    }
    context.pdfDocument.value = newDocument
    viewer.pdfDocument = newDocument
    resolveDestination([0, { name: 'Fit' }])
    await flushPromises()

    expect(viewer.scrollPageIntoView).not.toHaveBeenCalled()
  })

  it('ignores an outline response that resolves after the document changes', async () => {
    let resolveOldOutline!: (items: any[]) => void
    const oldDocument = {
      getOutline: vi.fn(() => new Promise(resolve => { resolveOldOutline = resolve })),
      numPages: 1,
    }
    const viewer: any = { pdfDocument: oldDocument, scrollPageIntoView: vi.fn() }
    const { context, wrapper } = mountOutline(oldDocument, viewer)

    const newDocument = {
      getOutline: vi.fn(async () => [createOutlineItem('New')]),
      numPages: 1,
    }
    context.pdfDocument.value = newDocument
    viewer.pdfDocument = newDocument
    resolveOldOutline([createOutlineItem('Old')])
    await flushPromises()

    expect(wrapper.text()).toContain('New')
    expect(wrapper.text()).not.toContain('Old')
  })

  it('resolves an uncached PDF page reference before navigating', async () => {
    const reference = { num: 9, gen: 0 }
    const item = createOutlineItem('Uncached', {
      dest: [reference, { name: 'Fit' }],
    })
    const document = {
      getOutline: vi.fn(async () => [item]),
      cachedPageNumber: vi.fn(() => null),
      getPageIndex: vi.fn(async () => 5),
      numPages: 10,
    }
    const viewer = { pdfDocument: document, scrollPageIntoView: vi.fn() }
    const { wrapper } = mountOutline(document, viewer)
    await flushPromises()

    await wrapper.get('.outline-title').trigger('click')
    await flushPromises()

    expect(document.getPageIndex).toHaveBeenCalledWith(reference)
    expect(viewer.scrollPageIntoView).toHaveBeenCalledWith({
      pageNumber: 6,
      destArray: item.dest,
    })
  })
})
