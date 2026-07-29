import { createPinia, setActivePinia } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  PdfViewerContextKey,
  UserContextKey,
  type PdfViewerContextValue,
} from '@/context/pdfViewerContext'
import { useAnnotationStore } from '@/stores/annotationStore'
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

  it('previews annotations from pointer and focus without changing selection', async () => {
    const annotation = makeAnnotation('annotation-1', 1)
    const coordinator = new AnnotationHoverCoordinator()
    const setAnnotationHover = vi.fn(coordinator.set.bind(coordinator))
    const clearAnnotationHover = vi.fn(coordinator.clear.bind(coordinator))
    const highlight = vi.fn()
    const store = useAnnotationStore()
    store.setPainter({
      can: vi.fn(() => false),
      highlight,
      setAnnotationHover,
      clearAnnotationHover,
      subscribeAnnotationHover: coordinator.subscribe,
      getAnnotationHoverSnapshot: coordinator.getSnapshot,
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

    expect(setAnnotationHover).toHaveBeenCalledWith('sidebar-pointer', annotation.id)
    expect(card.classes()).not.toContain('annotation-card--preview')
    expect(store.selectedAnnotation).toBeNull()
    expect(highlight).not.toHaveBeenCalled()

    const mouseLeave = new Event('pointerleave')
    Object.defineProperty(mouseLeave, 'pointerType', { value: 'mouse' })
    card.element.dispatchEvent(mouseLeave)
    await wrapper.vm.$nextTick()
    expect(clearAnnotationHover).toHaveBeenCalledWith('sidebar-pointer', annotation.id)
    expect(card.classes()).not.toContain('annotation-card--preview')

    const touchEnter = new Event('pointerenter')
    Object.defineProperty(touchEnter, 'pointerType', { value: 'touch' })
    card.element.dispatchEvent(touchEnter)
    expect(setAnnotationHover).toHaveBeenCalledTimes(1)

    const focusTarget = document.createElement('button')
    card.element.appendChild(focusTarget)
    focusTarget.focus()
    await wrapper.vm.$nextTick()
    expect(setAnnotationHover).toHaveBeenCalledWith('sidebar-focus', annotation.id)
    expect(card.classes()).not.toContain('annotation-card--preview')

    const ownedPortal = document.createElement('button')
    ownedPortal.dataset.annotationHoverOwner = annotation.id
    document.body.appendChild(ownedPortal)
    ownedPortal.focus()
    await wrapper.vm.$nextTick()
    expect(clearAnnotationHover).not.toHaveBeenCalledWith('sidebar-focus', annotation.id)

    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()
    await wrapper.vm.$nextTick()
    expect(clearAnnotationHover).toHaveBeenCalledWith('sidebar-focus', annotation.id)

    await wrapper.setProps({ selectedId: annotation.id })
    coordinator.set('sidebar-focus', annotation.id)
    await wrapper.vm.$nextTick()
    expect(card.classes()).toContain('!bg-accent')
    expect(card.classes()).not.toContain('annotation-card--preview')

    coordinator.clear('sidebar-focus', annotation.id)
    coordinator.set('canvas', annotation.id)
    await wrapper.vm.$nextTick()
    expect(card.classes()).toContain('annotation-card--preview')
    coordinator.clear('canvas', annotation.id)

    card.element.dispatchEvent(mouseEnter)
    focusTarget.focus()
    setAnnotationHover.mockClear()
    clearAnnotationHover.mockClear()
    wrapper.unmount()
    expect(clearAnnotationHover).toHaveBeenCalledWith('sidebar-pointer', annotation.id)
    expect(clearAnnotationHover).toHaveBeenCalledWith('sidebar-focus', annotation.id)
    ownedPortal.remove()
    outside.remove()
  })
})
