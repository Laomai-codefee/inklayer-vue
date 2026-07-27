import { defineComponent, h, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PdfViewerContextKey, type PdfViewerContextValue } from '@/context/pdfViewerContext'
import PdfThumbnailList from '../PdfThumbnailList.vue'

function createEventBus() {
  const handlers = new Map<string, (payload: unknown) => void>()
  return {
    on: vi.fn((name: string, handler: (payload: unknown) => void) => handlers.set(name, handler)),
    off: vi.fn((name: string) => handlers.delete(name)),
    dispatch: (name: string, payload: unknown) => handlers.get(name)?.(payload),
  }
}

describe('PdfThumbnailList', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    scrollIntoView.mockReset()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
  })

  it('renders all pages, follows page changes, and selects a page', async () => {
    const eventBus = createEventBus()
    const viewer = { currentPageNumber: 1 }
    const context: PdfViewerContextValue = {
      pdfDocument: ref({ numPages: 3 }),
      pdfViewer: ref(viewer),
      eventBus: ref(eventBus),
      viewerContainerRef: shallowRef(null),
      isReady: ref(true),
      activeSidebarPanel: ref(null),
      toggleSidebar: vi.fn(), openSidebar: vi.fn(), closeSidebar: vi.fn(),
      isSidebarCollapsed: ref(true), print: vi.fn(), download: vi.fn(),
    }
    const ThumbnailStub = defineComponent({
      props: ['pageNumber', 'selected', 'markerCount'],
      emits: ['select', 'layoutChange', 'elementChange'],
      mounted() {
        this.$emit('elementChange', this.pageNumber, this.$el)
      },
      render() {
        return h('button', {
          'data-page': this.pageNumber,
          'data-selected': String(this.selected),
          onClick: () => this.$emit('select', this.pageNumber),
        }, `${this.pageNumber}:${this.markerCount}`)
      },
    })

    const wrapper = mount(PdfThumbnailList, {
      props: { pageMarkerCounts: new Map([[2, 5]]) },
      global: {
        provide: { [PdfViewerContextKey as symbol]: context },
        stubs: { PdfThumbnail: ThumbnailStub },
      },
    })

    expect(wrapper.findAll('button')).toHaveLength(3)
    expect(wrapper.get('[data-page="2"]').text()).toBe('2:5')
    await wrapper.get('[data-page="3"]').trigger('click')
    expect(viewer.currentPageNumber).toBe(3)

    eventBus.dispatch('pagechanging', { pageNumber: 2 })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-page="2"]').attributes('data-selected')).toBe('true')
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('does not reclaim scroll after direct user interaction until the page changes', async () => {
    const eventBus = createEventBus()
    const context: PdfViewerContextValue = {
      pdfDocument: ref({ numPages: 2 }),
      pdfViewer: ref({ currentPageNumber: 1 }),
      eventBus: ref(eventBus),
      viewerContainerRef: shallowRef(null),
      isReady: ref(true),
      activeSidebarPanel: ref(null),
      toggleSidebar: vi.fn(), openSidebar: vi.fn(), closeSidebar: vi.fn(),
      isSidebarCollapsed: ref(true), print: vi.fn(), download: vi.fn(),
    }
    const ThumbnailStub = defineComponent({
      props: ['pageNumber'],
      emits: ['layoutChange', 'elementChange'],
      mounted() { this.$emit('elementChange', this.pageNumber, this.$el) },
      template: '<button @click="$emit(\'layoutChange\')">page</button>',
    })
    const wrapper = mount(PdfThumbnailList, {
      props: { pageMarkerCounts: new Map() },
      global: {
        provide: { [PdfViewerContextKey as symbol]: context },
        stubs: { PdfThumbnail: ThumbnailStub },
      },
    })

    scrollIntoView.mockClear()
    await wrapper.get('.thumbnail-list').trigger('wheel')
    await wrapper.get('button').trigger('click')
    expect(scrollIntoView).not.toHaveBeenCalled()

    eventBus.dispatch('pagechanging', { pageNumber: 2 })
    await wrapper.vm.$nextTick()
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('follows an initial current page whose element registers after the first watch', () => {
    const eventBus = createEventBus()
    const context: PdfViewerContextValue = {
      pdfDocument: ref({ numPages: 446 }),
      pdfViewer: ref({ currentPageNumber: 446 }),
      eventBus: ref(eventBus),
      viewerContainerRef: shallowRef(null),
      isReady: ref(true),
      activeSidebarPanel: ref(null),
      toggleSidebar: vi.fn(), openSidebar: vi.fn(), closeSidebar: vi.fn(),
      isSidebarCollapsed: ref(true), print: vi.fn(), download: vi.fn(),
    }
    const ThumbnailStub = defineComponent({
      props: ['pageNumber'],
      emits: ['elementChange'],
      mounted() { this.$emit('elementChange', this.pageNumber, this.$el) },
      template: '<button />',
    })

    mount(PdfThumbnailList, {
      props: { pageMarkerCounts: new Map() },
      global: {
        provide: { [PdfViewerContextKey as symbol]: context },
        stubs: { PdfThumbnail: ThumbnailStub },
      },
    })

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
  })
})
