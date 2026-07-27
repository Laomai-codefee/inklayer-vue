import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PdfThumbnail from '../PdfThumbnail.vue'

describe('PdfThumbnail', () => {
  const context = {}

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', undefined)
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as CanvasRenderingContext2D)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders at a device pixel ratio capped at two and reports the real marker count', async () => {
    const render = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }))
    const page = {
      getViewport: vi.fn(({ scale }: { scale: number }) => ({
        width: 200 * scale,
        height: 300 * scale,
      })),
      render,
    }
    const pdfDocument = { getPage: vi.fn(async () => page) }
    const wrapper = mount(PdfThumbnail, {
      props: {
        pdfDocument: pdfDocument as any,
        pageNumber: 3,
        selected: true,
        markerCount: 120,
      },
    })

    await vi.waitFor(() => expect(render).toHaveBeenCalled())
    const canvas = wrapper.get('canvas').element
    expect(canvas.width).toBe(264)
    expect(canvas.height).toBe(396)
    expect(wrapper.get('.thumbnail-marker').text()).toBe('99+')
    expect(wrapper.get('button').attributes('aria-label')).toContain('120')
    expect(wrapper.emitted('layoutChange')).toHaveLength(1)
  })

  it('cancels an in-progress render on unmount', async () => {
    const cancel = vi.fn()
    const page = {
      getViewport: vi.fn(({ scale }: { scale: number }) => ({
        width: 200 * scale,
        height: 300 * scale,
      })),
      render: vi.fn(() => ({ promise: new Promise(() => undefined), cancel })),
    }
    const wrapper = mount(PdfThumbnail, {
      props: {
        pdfDocument: { getPage: vi.fn(async () => page) } as any,
        pageNumber: 1,
        selected: false,
        markerCount: 0,
      },
    })
    await vi.waitFor(() => expect(page.render).toHaveBeenCalled())
    wrapper.unmount()
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('reserves the first-page aspect ratio before the canvas enters the viewport', async () => {
    let intersectionCallback: IntersectionObserverCallback | null = null
    vi.stubGlobal('IntersectionObserver', vi.fn((callback: IntersectionObserverCallback) => {
      intersectionCallback = callback
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
        takeRecords: () => [],
        root: null,
        rootMargin: '',
        thresholds: [],
      }
    }))
    const page = {
      getViewport: vi.fn(({ scale }: { scale: number }) => ({
        width: 200 * scale,
        height: 300 * scale,
      })),
      render: vi.fn(),
    }
    const pdfDocument = { getPage: vi.fn(async () => page) }
    const wrapper = mount(PdfThumbnail, {
      props: {
        pdfDocument: pdfDocument as any,
        pageNumber: 8,
        selected: true,
        markerCount: 0,
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.get('.thumbnail-canvas-wrapper').attributes('style')).toContain('height: 198px')
    })
    expect(page.render).not.toHaveBeenCalled()
    expect(intersectionCallback).toBeTypeOf('function')
    expect(wrapper.get('.thumbnail-canvas-wrapper').classes()).toContain('!border-primary')
  })

  it('shows the localized fallback when page rendering fails', async () => {
    const pdfDocument = {
      getPage: vi.fn(async () => {
        throw new Error('render failed')
      }),
    }
    const wrapper = mount(PdfThumbnail, {
      props: {
        pdfDocument: pdfDocument as any,
        pageNumber: 1,
        selected: false,
        markerCount: 0,
      },
    })

    await vi.waitFor(() => expect(wrapper.find('.thumbnail-error').exists()).toBe(true))
    expect(wrapper.get('.thumbnail-error').text()).not.toBe('')
  })
})
