import { createPinia, setActivePinia } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  PdfViewerContextKey,
  UserContextKey,
  type PdfViewerContextValue,
} from '@/context/pdfViewerContext'
import { SelectionSource, useAnnotationStore } from '@/stores/annotationStore'
import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
} from '../../../const/definitions'
import { AnnotationHoverCoordinator } from '../../../painter/annotation_hover'
import AnnotationSidebar from '../AnnotationSidebar.vue'

function makeAnnotation(
  id: string,
  referenceNumber: number,
  overrides: Partial<IAnnotationStore> = {}
): IAnnotationStore {
  return {
    id,
    referenceNumber,
    pageNumber: referenceNumber,
    konvaString: '{}',
    konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
    title: `Author ${referenceNumber}`,
    type: AnnotationType.RECTANGLE,
    color: '#000000',
    subtype: 'Square',
    pdfjsType: PdfjsAnnotationType.SQUARE,
    date: "D:20260729121200+08'00'",
    contentsObj: { text: '' },
    comments: [],
    user: {
      id: `user-${referenceNumber}`,
      name: `Author ${referenceNumber}`,
    },
    native: false,
    ...overrides,
  }
}

function createPdfContext(): PdfViewerContextValue {
  return {
    pdfDocument: ref(null),
    pdfViewer: ref(null),
    eventBus: ref(null),
    viewerContainerRef: shallowRef(null),
    isReady: ref(true),
    activeSidebarPanel: ref('comments'),
    toggleSidebar: vi.fn(),
    openSidebar: vi.fn(),
    closeSidebar: vi.fn(),
    isSidebarCollapsed: ref(false),
    print: vi.fn(),
    download: vi.fn(),
  }
}

const slotStub = { template: '<div><slot /></div>' }
const referenceInputStub = {
  props: ['placeholder'],
  template: '<div data-annotation-editor><textarea class="reference-input-stub" :placeholder="placeholder" /></div>',
}

describe('AnnotationSidebar references', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('uses #N as the primary identity and routes reference activation to the target', async () => {
    const target = makeAnnotation('annotation-2', 2)
    const source = makeAnnotation('annotation-1', 1, {
      contentsObj: {
        text: 'See #2.',
        references: [{
          type: 'annotation',
          annotationId: target.id,
          label: '#2',
        }],
      },
    })
    const highlight = vi.fn(() => Promise.resolve(true))
    const coordinator = new AnnotationHoverCoordinator()
    const store = useAnnotationStore()
    store.setPainter({
      can: vi.fn(() => true),
      highlight,
      setAnnotationHover: coordinator.set.bind(coordinator),
      clearAnnotationHover: coordinator.clear.bind(coordinator),
      subscribeAnnotationHover: coordinator.subscribe,
      getAnnotationHoverSnapshot: coordinator.getSnapshot,
    } as never)

    const wrapper = mount(AnnotationSidebar, {
      props: {
        annotations: [source, target],
        selectedId: source.id,
      },
      global: {
        provide: {
          [PdfViewerContextKey as symbol]: createPdfContext(),
          [UserContextKey as symbol]: {
            user: computed(() => ({ id: 'bob', name: 'Bob' })),
          },
        },
        stubs: {
          ScrollArea: slotStub,
          Popover: {
            template: '<div><slot name="trigger" /><slot /></div>',
          },
          Tooltip: {
            template: '<span><slot name="trigger" /></span>',
          },
          DropdownMenu: {
            template: '<div><slot name="trigger" /><slot /></div>',
          },
          DropdownMenuItem: {
            template: '<button @click="$emit(\'select\')"><slot /></button>',
          },
          AnnotationReferenceInput: slotStub,
          AnnotationReferenceText: {
            props: ['content'],
            template: '<button class="reference-stub" @click.stop="$emit(\'activate\', \'annotation-2\')">{{ content }}</button>',
          },
        },
      },
    })

    const cards = wrapper.findAll('[id^="annotation-"]')
    expect(cards[0].text()).toContain('#1')
    expect(cards[0].text()).toContain('Author 1')
    expect(cards[1].text()).toContain('#2')

    const editTarget = cards[1]
      .findAll('button')
      .find(button => ['Edit', '编辑'].includes(button.text()))
    expect(editTarget).toBeDefined()
    await editTarget!.trigger('click')

    expect(highlight).toHaveBeenLastCalledWith(target)
    expect(store.selectedAnnotation?.store?.id).toBe(target.id)

    highlight.mockClear()
    await cards[0].get('.reference-stub').trigger('click')

    expect(highlight).toHaveBeenCalledWith(target)
    expect(store.selectedAnnotation?.store?.id).toBe(target.id)
    wrapper.unmount()
  })

  it('keeps pointer and focus hover local, and only links panels after selection', async () => {
    const annotation = makeAnnotation('annotation-1', 1)
    const setAnnotationHover = vi.fn()
    const clearAnnotationHover = vi.fn()
    const highlight = vi.fn()
    const store = useAnnotationStore()
    store.setPainter({
      can: vi.fn(() => false),
      highlight,
      setAnnotationHover,
      clearAnnotationHover,
      subscribeAnnotationHover: vi.fn(),
      getAnnotationHoverSnapshot: vi.fn(() => ({ annotationId: null, source: null })),
    } as never)

    const wrapper = mount(AnnotationSidebar, {
      attachTo: document.body,
      props: {
        annotations: [annotation],
      },
      global: {
        provide: {
          [PdfViewerContextKey as symbol]: createPdfContext(),
          [UserContextKey as symbol]: {
            user: computed(() => ({ id: 'bob', name: 'Bob' })),
          },
        },
        stubs: {
          ScrollArea: slotStub,
          Popover: {
            template: '<div><slot name="trigger" /><slot /></div>',
          },
          Tooltip: {
            template: '<span><slot name="trigger" /></span>',
          },
          DropdownMenu: {
            template: '<div><slot name="trigger" /><slot /></div>',
          },
          DropdownMenuItem: slotStub,
          AnnotationReferenceInput: slotStub,
          AnnotationReferenceText: slotStub,
        },
      },
    })

    const card = wrapper.get(`#annotation-${annotation.id}`)
    const mouseEnter = new Event('pointerenter')
    Object.defineProperty(mouseEnter, 'pointerType', { value: 'mouse' })
    card.element.dispatchEvent(mouseEnter)
    await wrapper.vm.$nextTick()

    expect(setAnnotationHover).not.toHaveBeenCalled()
    expect(store.selectedAnnotation).toBeNull()
    expect(highlight).not.toHaveBeenCalled()

    const mouseLeave = new Event('pointerleave')
    Object.defineProperty(mouseLeave, 'pointerType', { value: 'mouse' })
    card.element.dispatchEvent(mouseLeave)
    await wrapper.vm.$nextTick()
    expect(clearAnnotationHover).not.toHaveBeenCalled()

    const focusTarget = document.createElement('button')
    card.element.appendChild(focusTarget)
    focusTarget.focus()
    await wrapper.vm.$nextTick()
    expect(setAnnotationHover).not.toHaveBeenCalled()

    await card.trigger('click')
    expect(store.selectedAnnotation?.store?.id).toBe(annotation.id)
    expect(highlight).toHaveBeenCalledWith(annotation)

    wrapper.unmount()
    expect(clearAnnotationHover).not.toHaveBeenCalled()
  })

  it('uses localized InkLayer tool names and keeps tools with the same PDF subtype separate', () => {
    const highlight = makeAnnotation('annotation-1', 1, {
      type: AnnotationType.HIGHLIGHT,
      pdfjsType: PdfjsAnnotationType.HIGHLIGHT,
      subtype: 'Highlight',
    })
    const freeHighlight = makeAnnotation('annotation-2', 2, {
      type: AnnotationType.FREE_HIGHLIGHT,
      pdfjsType: PdfjsAnnotationType.HIGHLIGHT,
      subtype: 'Highlight',
    })

    const wrapper = mount(AnnotationSidebar, {
      props: { annotations: [highlight, freeHighlight] },
      global: {
        provide: {
          [PdfViewerContextKey as symbol]: createPdfContext(),
          [UserContextKey as symbol]: { user: computed(() => ({ id: 'bob', name: 'Bob' })) },
        },
        stubs: {
          ScrollArea: slotStub,
          Popover: { template: '<div><slot name="trigger" /><slot /></div>' },
          Tooltip: { template: '<span><slot name="trigger" /></span>' },
          DropdownMenu: { template: '<div><slot name="trigger" /><slot /></div>' },
          DropdownMenuItem: slotStub,
          AnnotationReferenceInput: slotStub,
          AnnotationReferenceText: slotStub,
        },
      },
    })

    const labels = wrapper.findAll('label[for^="ft-"]').map(label => label.text())
    expect(labels).toEqual(['高亮 (1)', '自由高亮 (1)'])
    wrapper.unmount()
  })

  it('preserves user filters when annotation content changes', async () => {
    const annotation = makeAnnotation('annotation-1', 1)
    const wrapper = mount(AnnotationSidebar, {
      props: { annotations: [annotation] },
      global: {
        provide: {
          [PdfViewerContextKey as symbol]: createPdfContext(),
          [UserContextKey as symbol]: { user: computed(() => ({ id: 'bob', name: 'Bob' })) },
        },
        stubs: {
          ScrollArea: slotStub,
          Popover: { template: '<div><slot name="trigger" /><slot /></div>' },
          Tooltip: { template: '<span><slot name="trigger" /></span>' },
          DropdownMenu: { template: '<div><slot name="trigger" /><slot /></div>' },
          DropdownMenuItem: slotStub,
          AnnotationReferenceInput: slotStub,
          AnnotationReferenceText: slotStub,
        },
      },
    })
    const authorFilter = wrapper.get('input[id^="fu-"]')
    await authorFilter.setValue(false)

    await wrapper.setProps({
      annotations: [{ ...annotation, contentsObj: { text: 'Updated comment' } }],
    })

    expect((wrapper.get('input[id^="fu-"]').element as HTMLInputElement).checked).toBe(false)
    wrapper.unmount()
  })

  it('scrolls a newly opened Canvas editor into the visible Sidebar area', async () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    const annotation = makeAnnotation('annotation-1', 1)
    const store = useAnnotationStore()
    store.setPainter({
      can: vi.fn((action: string) => action === 'annotation.edit'),
      highlight: vi.fn(),
    } as never)
    const wrapper = mount(AnnotationSidebar, {
      attachTo: document.body,
      props: { annotations: [annotation], selectedId: annotation.id },
      global: {
        provide: {
          [PdfViewerContextKey as symbol]: createPdfContext(),
          [UserContextKey as symbol]: { user: computed(() => ({ id: 'bob', name: 'Bob' })) },
        },
        stubs: {
          ScrollArea: slotStub,
          Popover: { template: '<div><slot name="trigger" /><slot /></div>' },
          Tooltip: { template: '<span><slot name="trigger" /></span>' },
          DropdownMenu: { template: '<div><slot name="trigger" /><slot /></div>' },
          DropdownMenuItem: slotStub,
          AnnotationReferenceInput: referenceInputStub,
          AnnotationReferenceText: slotStub,
        },
      },
    })

    store.setSelectedAnnotation(annotation, SelectionSource.CANVAS)
    await wrapper.vm.$nextTick()
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))

    expect(wrapper.find('[data-annotation-editor]').exists()).toBe(true)
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'nearest',
      inline: 'nearest',
    })
    wrapper.unmount()
  })

  it('uses distinct placeholders for annotation comments and replies', async () => {
    const annotation = makeAnnotation('annotation-1', 1)
    const store = useAnnotationStore()
    const mountSidebar = () => mount(AnnotationSidebar, {
      props: {
        annotations: [annotation],
        selectedId: annotation.id,
      },
      global: {
        provide: {
          [PdfViewerContextKey as symbol]: createPdfContext(),
          [UserContextKey as symbol]: {
            user: computed(() => ({ id: 'bob', name: 'Bob' })),
          },
        },
        stubs: {
          ScrollArea: slotStub,
          Popover: {
            template: '<div><slot name="trigger" /><slot /></div>',
          },
          Tooltip: {
            template: '<span><slot name="trigger" /></span>',
          },
          DropdownMenu: {
            template: '<div><slot name="trigger" /><slot /></div>',
          },
          DropdownMenuItem: {
            template: '<button class="menu-item-stub" @click="$emit(\'select\')"><slot /></button>',
          },
          AnnotationReferenceInput: referenceInputStub,
          AnnotationReferenceText: slotStub,
        },
      },
    })

    store.setPainter({
      can: vi.fn((action: string) => action === 'annotation.edit'),
      highlight: vi.fn(),
      subscribeAnnotationHover: vi.fn(() => () => {}),
      getAnnotationHoverSnapshot: vi.fn(() => ({ annotationId: null, source: null })),
    } as never)
    const commentWrapper = mountSidebar()
    const editButton = commentWrapper.findAll('.menu-item-stub')
      .find(button => button.text() === '编辑')
    expect(editButton).toBeDefined()
    await editButton!.trigger('click')
    expect(commentWrapper.get('.reference-input-stub').attributes('placeholder'))
      .toBe('发表评论或用“#”引用批注')
    commentWrapper.unmount()

    store.setPainter({
      can: vi.fn((action: string) => action === 'annotation.comment'),
      highlight: vi.fn(),
      subscribeAnnotationHover: vi.fn(() => () => {}),
      getAnnotationHoverSnapshot: vi.fn(() => ({ annotationId: null, source: null })),
    } as never)
    const replyWrapper = mountSidebar()
    const replyButton = replyWrapper.findAll('.menu-item-stub')
      .find(button => button.text() === '回复')
    expect(replyButton).toBeDefined()
    await replyButton!.trigger('click')
    expect(replyWrapper.get('.reference-input-stub').attributes('placeholder'))
      .toBe('回复或用“#”引用批注')
    replyWrapper.unmount()
  })
})
