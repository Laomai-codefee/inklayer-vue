import { ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PdfViewerContextKey, type PdfViewerContextValue } from '@/context/pdfViewerContext'
import PageIndicator from '../PageIndicator.vue'

function createEventBus() {
  const handlers = new Map<string, (payload: any) => void>()
  return {
    on: vi.fn((name: string, handler: (payload: any) => void) => handlers.set(name, handler)),
    off: vi.fn((name: string) => handlers.delete(name)),
    dispatch: (name: string, payload: any) => handlers.get(name)?.(payload),
  }
}

function mountIndicator() {
  const eventBus = createEventBus()
  const container = document.createElement('div')
  const viewer = { currentPageNumber: 2, pagesCount: 10, container }
  const context: PdfViewerContextValue = {
    pdfDocument: ref({}),
    pdfViewer: ref(viewer),
    eventBus: ref(eventBus),
    viewerContainerRef: shallowRef(container),
    isReady: ref(true),
    activeSidebarPanel: ref(null),
    toggleSidebar: vi.fn(), openSidebar: vi.fn(), closeSidebar: vi.fn(),
    isSidebarCollapsed: ref(true), print: vi.fn(), download: vi.fn(),
  }
  return { context, eventBus, container, viewer, wrapper: mount(PageIndicator, {
    global: { provide: { [PdfViewerContextKey as symbol]: context } },
  }) }
}

describe('PageIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('selects the whole page value on double click and navigates on Enter', async () => {
    const { wrapper, viewer } = mountIndicator()
    const input = wrapper.get('input')
    const select = vi.spyOn(input.element, 'select')

    await input.trigger('dblclick')
    expect(select).toHaveBeenCalledOnce()

    await input.setValue('7')
    await input.trigger('keydown', { key: 'Enter' })
    expect(viewer.currentPageNumber).toBe(7)
  })

  it('stays visible while hovered and hides three seconds after leaving', async () => {
    const { wrapper } = mountIndicator()
    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(5000)
    expect(wrapper.attributes('style')).toContain('opacity: 1')

    await wrapper.trigger('mouseleave')
    vi.advanceTimersByTime(2999)
    expect(wrapper.attributes('style')).toContain('opacity: 1')
    vi.advanceTimersByTime(1)
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('style')).toContain('opacity: 0')
  })

  it('syncs page events and removes listeners on unmount', async () => {
    const { wrapper, eventBus, container } = mountIndicator()
    eventBus.dispatch('pagechanging', { pageNumber: 6 })
    await wrapper.vm.$nextTick()
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('6')

    wrapper.unmount()
    expect(eventBus.off).toHaveBeenCalledWith('pagechanging', expect.any(Function))
    expect(() => container.dispatchEvent(new Event('scroll'))).not.toThrow()
  })

  it('moves listeners when the event bus changes', async () => {
    const { wrapper, context, eventBus } = mountIndicator()
    const nextEventBus = createEventBus()

    context.eventBus.value = nextEventBus
    await wrapper.vm.$nextTick()

    expect(eventBus.off).toHaveBeenCalledWith('pagechanging', expect.any(Function))
    expect(nextEventBus.on).toHaveBeenCalledWith('pagechanging', expect.any(Function))
    nextEventBus.dispatch('pagechanging', { pageNumber: 9 })
    await wrapper.vm.$nextTick()
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('9')
  })
})
