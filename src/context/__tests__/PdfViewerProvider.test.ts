import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const providerMocks = vi.hoisted(() => {
  let scaleValue: string | number = 'auto'
  const setScaleValue = vi.fn()
  const update = vi.fn()
  const eventBus = { on: vi.fn(), off: vi.fn() }
  const viewer = {
    get currentScaleValue() { return scaleValue },
    set currentScaleValue(value: string | number) {
      scaleValue = value
      setScaleValue(value)
    },
    update,
  }
  return {
    viewer,
    eventBus,
    setScaleValue,
    update,
    setScale: (value: string | number) => { scaleValue = value },
  }
})

vi.mock('@/composables/usePdfViewer', async () => {
  const { ref, shallowRef } = await import('vue')
  return {
    usePdfViewer: () => ({
      loading: ref(false),
      progress: ref(100),
      pdfDocument: ref(null),
      pdfViewer: shallowRef(providerMocks.viewer),
      eventBus: shallowRef(providerMocks.eventBus),
      loadError: ref(null),
    }),
  }
})

vi.mock('@/composables/usePdfTool', () => ({
  usePdfTool: () => ({ printClean: vi.fn(), downloadClean: vi.fn() }),
}))
vi.mock('@/composables/usePinchZoom', () => ({ usePinchZoom: vi.fn() }))

import PdfViewerProvider from '../PdfViewerProvider.vue'

function fireTransitionEnd(element: Element, propertyName: string) {
  const event = new Event('transitionend', { bubbles: true })
  Object.defineProperty(event, 'propertyName', { value: propertyName })
  element.dispatchEvent(event)
}

function mountProvider(options: Record<string, unknown> = {}) {
  return mount(PdfViewerProvider, {
    props: { title: 'A very long document title', ...options },
    global: {
      stubs: {
        NavigationSidebar: {
          props: ['open'],
          emits: ['close', 'transitionEnd'],
          template: '<aside id="InkLayer-navigation-sidebar" :aria-hidden="!open" @transitionend="$emit(\'transitionEnd\', $event)" />',
        },
        PageIndicator: true,
        ScrollArea: { template: '<div><slot /></div>' },
      },
    },
  })
}

describe('PdfViewerProvider document navigation layout', () => {
  beforeEach(() => {
    providerMocks.setScale('auto')
    providerMocks.setScaleValue.mockClear()
    providerMocks.update.mockClear()
    providerMocks.eventBus.on.mockClear()
    providerMocks.eventBus.off.mockClear()
  })

  it('places navigation beside the viewer and toggles it from the header', async () => {
    const wrapper = mountProvider()
    const trigger = wrapper.get('[aria-controls="InkLayer-navigation-sidebar"]')
    const sidebar = wrapper.get('#InkLayer-navigation-sidebar')

    expect(sidebar.attributes('aria-hidden')).toBe('true')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(sidebar.element.nextElementSibling?.querySelector('.pdfViewer')).not.toBeNull()

    await trigger.trigger('click')
    expect(sidebar.attributes('aria-hidden')).toBe('false')
    expect(trigger.attributes('aria-expanded')).toBe('true')
  })

  it('labels extension sidebar controls and hides the closed panel from assistive technology', async () => {
    const wrapper = mountProvider({
      sidebar: [{ key: 'comments', title: 'Comments', icon: 'annotations' }],
    })
    const trigger = wrapper.get('button[aria-label="Comments"]')
    const sidebar = wrapper.get('#InkLayer-viewer-sidebar')

    expect(trigger.attributes('title')).toBe('Comments')
    expect(sidebar.attributes('aria-hidden')).toBe('true')

    await trigger.trigger('click')
    expect(sidebar.attributes('aria-hidden')).toBe('false')
  })

  it('recalculates adaptive scale once after either desktop sidebar width transition', () => {
    const wrapper = mountProvider({
      sidebar: [{ key: 'comments', title: 'Comments', icon: 'annotations' }],
    })
    providerMocks.setScaleValue.mockClear()
    providerMocks.update.mockClear()

    fireTransitionEnd(wrapper.get('#InkLayer-navigation-sidebar').element, 'width')
    expect(providerMocks.setScaleValue).toHaveBeenLastCalledWith('auto')
    expect(providerMocks.setScaleValue).toHaveBeenCalledTimes(1)
    expect(providerMocks.update).not.toHaveBeenCalled()

    fireTransitionEnd(wrapper.get('.sidebar-panel').element, 'width')
    expect(providerMocks.setScaleValue).toHaveBeenCalledTimes(2)
    expect(providerMocks.update).not.toHaveBeenCalled()
  })

  it('ignores fixed scale, transform transitions, and child transitions', () => {
    const wrapper = mountProvider()
    const sidebar = wrapper.get('#InkLayer-navigation-sidebar')
    providerMocks.setScale(1.5)
    providerMocks.setScaleValue.mockClear()
    providerMocks.update.mockClear()

    fireTransitionEnd(sidebar.element, 'transform')
    fireTransitionEnd(sidebar.element.appendChild(document.createElement('span')), 'width')

    expect(providerMocks.setScaleValue).not.toHaveBeenCalled()
    expect(providerMocks.update).not.toHaveBeenCalled()
  })
})
