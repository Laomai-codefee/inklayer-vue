import { ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PdfViewerContextKey, type PdfViewerContextValue } from '@/context/pdfViewerContext'
import {
  NAVIGATION_PAGE_MARKERS_CHANGED_EVENT,
  type NavigationPageMarkersChangedEvent,
} from '../navigationPageMarkers'
import NavigationSidebar from '../NavigationSidebar.vue'

function createEventBus() {
  const listeners = new Map<string, Set<(payload: any) => void>>()
  return {
    on: vi.fn((name: string, handler: (payload: any) => void) => {
      const handlers = listeners.get(name) ?? new Set()
      handlers.add(handler)
      listeners.set(name, handlers)
    }),
    off: vi.fn((name: string, handler: (payload: any) => void) => {
      listeners.get(name)?.delete(handler)
    }),
    dispatch(name: string, payload: unknown) {
      listeners.get(name)?.forEach(handler => handler(payload))
    },
  }
}

function createContext(eventBus = createEventBus()): PdfViewerContextValue {
  return {
    pdfDocument: ref(null),
    pdfViewer: ref(null),
    eventBus: ref(eventBus),
    viewerContainerRef: shallowRef(null),
    isReady: ref(false),
    activeSidebarPanel: ref(null),
    toggleSidebar: vi.fn(),
    openSidebar: vi.fn(),
    closeSidebar: vi.fn(),
    isSidebarCollapsed: ref(true),
    print: vi.fn(),
    download: vi.fn(),
  }
}

function mountSidebar(context: PdfViewerContextValue, open = true) {
  return mount(NavigationSidebar, {
    props: { open },
    global: {
      provide: { [PdfViewerContextKey as symbol]: context },
      stubs: {
        Tabs: { template: '<div><slot /></div>' },
        TabsList: { template: '<div><slot /></div>' },
        TabsTrigger: { template: '<button><slot /></button>' },
        TabsContent: { template: '<div><slot /></div>' },
        PdfThumbnailList: {
          props: ['pageMarkerCounts'],
          template: '<div data-testid="markers">{{ markerText }}</div>',
          computed: {
            markerText() {
              return (Array.from((this as any).pageMarkerCounts.entries()) as Array<[number, number]>)
                .map(([page, count]) => `${page}:${count}`)
                .join(',')
            },
          },
        },
        PdfOutline: { template: '<button data-testid="outline" @click="$emit(\'navigate\')">Outline</button>' },
      },
    },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('NavigationSidebar', () => {
  it('aggregates marker sources and removes empty sources', async () => {
    const eventBus = createEventBus()
    const wrapper = mountSidebar(createContext(eventBus))

    eventBus.dispatch(NAVIGATION_PAGE_MARKERS_CHANGED_EVENT, {
      source: 'annotator',
      markers: new Map([[1, 2]]),
    } satisfies NavigationPageMarkersChangedEvent)
    eventBus.dispatch(NAVIGATION_PAGE_MARKERS_CHANGED_EVENT, {
      source: 'search',
      markers: new Map([[1, 1], [2, 4]]),
    } satisfies NavigationPageMarkersChangedEvent)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-testid="markers"]').text()).toBe('1:3,2:4')

    eventBus.dispatch(NAVIGATION_PAGE_MARKERS_CHANGED_EVENT, {
      source: 'search',
      markers: new Map(),
    } satisfies NavigationPageMarkersChangedEvent)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-testid="markers"]').text()).toBe('1:2')
  })

  it('cleans the old event bus and marker state when the bus changes', async () => {
    const firstBus = createEventBus()
    const secondBus = createEventBus()
    const context = createContext(firstBus)
    const wrapper = mountSidebar(context)

    firstBus.dispatch(NAVIGATION_PAGE_MARKERS_CHANGED_EVENT, {
      source: 'annotator',
      markers: new Map([[4, 3]]),
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-testid="markers"]').text()).toBe('4:3')

    context.eventBus.value = secondBus
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-testid="markers"]').text()).toBe('')
    expect(firstBus.off).toHaveBeenCalledWith(
      NAVIGATION_PAGE_MARKERS_CHANGED_EVENT,
      expect.any(Function),
    )
  })

  it('closes on Escape and after mobile outline navigation', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const wrapper = mountSidebar(createContext())

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toHaveLength(1)

    await wrapper.get('[data-testid="outline"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
  })
})
