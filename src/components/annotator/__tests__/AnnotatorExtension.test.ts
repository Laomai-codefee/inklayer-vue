import { computed, ref, shallowRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PdfViewerContextKey, UserContextKey, type PdfViewerContextValue } from '@/context/pdfViewerContext'
import { useAnnotationStore } from '@/stores/annotationStore'
import { NAVIGATION_PAGE_MARKERS_CHANGED_EVENT } from '@/components/navigation/navigationPageMarkers'

const painterMocks = vi.hoisted(() => ({
    instances: [] as any[],
    resolveAnnotations: null as null | (() => void),
    menuClose: vi.fn()
}))

vi.mock('@/extensions/annotator/painter', () => ({
    Painter: class MockPainter {
        options: Record<string, unknown>
        initWebSelection = vi.fn()
        destroy = vi.fn()
        activate = vi.fn()
        setPermissionContext = vi.fn()
        reRenderAnnotations = vi.fn()
        getKonvaCanvasStore = vi.fn(() => new Map([[1, {}]]))
        getDeleteUndoSnapshot = vi.fn(() => null)
        subscribeDeleteUndo = vi.fn(() => () => {})
        initAnnotationsOnce = vi.fn(() => new Promise<void>((resolve) => {
            painterMocks.resolveAnnotations = resolve
        }))
        constructor(options: Record<string, unknown>) {
            this.options = options
            painterMocks.instances.push(this)
        }
    }
}))

vi.mock('@/extensions/annotator/components/selection_bar/SelectionBar.vue', () => ({
    default: { template: '<div />', methods: { setPainterRef() {}, open() {}, close() {} } }
}))
vi.mock('@/extensions/annotator/components/menu_bar/MenuBar.vue', () => ({
    default: {
        template: '<div />',
        methods: {
            setMenuBarPainter() {},
            open() {},
            close() { painterMocks.menuClose() }
        }
    }
}))

import AnnotatorExtension from '../AnnotatorExtension.vue'

describe('AnnotatorExtension lifecycle', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        painterMocks.instances.length = 0
        painterMocks.resolveAnnotations = null
        painterMocks.menuClose.mockClear()
    })

    it('does not rerender after unmount while annotations are still loading', async () => {
        const eventBus = {
            on: vi.fn(),
            off: vi.fn(),
            _on: vi.fn(),
            _off: vi.fn(),
            dispatch: vi.fn()
        }
        const viewerElement = document.createElement('div')
        const viewer = {
            viewer: viewerElement,
            pdfDocument: {},
            pagesCount: 1,
            getPageView: vi.fn(() => ({ div: document.createElement('div'), canvas: document.createElement('canvas') }))
        }
        const pdfContext: PdfViewerContextValue = {
            pdfDocument: ref({}),
            pdfViewer: ref(viewer),
            eventBus: ref(eventBus),
            viewerContainerRef: shallowRef(null),
            isReady: ref(true),
            activeSidebarPanel: ref(null),
            toggleSidebar: vi.fn(),
            openSidebar: vi.fn(),
            closeSidebar: vi.fn(),
            isSidebarCollapsed: ref(false),
            print: vi.fn(),
            download: vi.fn()
        }

        const wrapper = mount(AnnotatorExtension, {
            props: { defaultShowAnnotationAuthorLabels: true },
            global: {
                provide: {
                    [PdfViewerContextKey as symbol]: pdfContext,
                    [UserContextKey as symbol]: { user: computed(() => ({ id: 'test', name: 'Test' })) }
                }
            }
        })
        await vi.waitFor(() => expect(painterMocks.resolveAnnotations).toBeTypeOf('function'))
        const painter = painterMocks.instances[0]
        expect(painter.options.defaultShowAnnotationAuthorLabels).toBe(true)

        wrapper.unmount()
        painterMocks.resolveAnnotations?.()
        await flushPromises()

        expect(painter.destroy).toHaveBeenCalledOnce()
        expect(painter.reRenderAnnotations).not.toHaveBeenCalled()
        expect(eventBus.off).toHaveBeenCalledWith('pagerendered', expect.any(Function))
        expect(eventBus.off).toHaveBeenCalledWith('documentloaded', expect.any(Function))
    })

    it('closes the old annotation menu before applying a new permission context', async () => {
        const eventBus = {
            on: vi.fn(), off: vi.fn(), _on: vi.fn(), _off: vi.fn(), dispatch: vi.fn()
        }
        const viewer = {
            viewer: document.createElement('div'),
            pdfDocument: {},
            pagesCount: 1,
            getPageView: vi.fn()
        }
        const pdfContext: PdfViewerContextValue = {
            pdfDocument: ref({}),
            pdfViewer: ref(viewer),
            eventBus: ref(eventBus),
            viewerContainerRef: shallowRef(null),
            isReady: ref(true),
            activeSidebarPanel: ref(null),
            toggleSidebar: vi.fn(), openSidebar: vi.fn(), closeSidebar: vi.fn(),
            isSidebarCollapsed: ref(false), print: vi.fn(), download: vi.fn()
        }
        const user = ref({ id: 'alice', name: 'Alice' })
        const wrapper = mount(AnnotatorExtension, {
            props: { annotationPermissions: { mode: 'owner-only' } },
            global: {
                provide: {
                    [PdfViewerContextKey as symbol]: pdfContext,
                    [UserContextKey as symbol]: { user: computed(() => user.value) }
                }
            }
        })
        const painter = painterMocks.instances[0]
        painterMocks.menuClose.mockClear()

        user.value = { id: 'bob', name: 'Bob' }
        await wrapper.setProps({ annotationPermissions: { mode: 'unrestricted' } })

        expect(painterMocks.menuClose).toHaveBeenCalledOnce()
        expect(painter.setPermissionContext).toHaveBeenCalledWith(
            { id: 'bob', name: 'Bob' },
            { mode: 'unrestricted' }
        )
        expect(painterMocks.instances).toHaveLength(1)
        wrapper.unmount()
    })

    it('publishes annotation counts by page and clears them on unmount', async () => {
        const eventBus = {
            on: vi.fn(), off: vi.fn(), _on: vi.fn(), _off: vi.fn(), dispatch: vi.fn()
        }
        const viewer = {
            viewer: document.createElement('div'),
            pdfDocument: {},
            pagesCount: 1,
            getPageView: vi.fn()
        }
        const pdfContext: PdfViewerContextValue = {
            pdfDocument: ref({}),
            pdfViewer: ref(viewer),
            eventBus: ref(eventBus),
            viewerContainerRef: shallowRef(null),
            isReady: ref(true),
            activeSidebarPanel: ref(null),
            toggleSidebar: vi.fn(), openSidebar: vi.fn(), closeSidebar: vi.fn(),
            isSidebarCollapsed: ref(false), print: vi.fn(), download: vi.fn()
        }
        const wrapper = mount(AnnotatorExtension, {
            global: {
                provide: {
                    [PdfViewerContextKey as symbol]: pdfContext,
                    [UserContextKey as symbol]: { user: computed(() => ({ id: 'test', name: 'Test' })) }
                }
            }
        })
        const store = useAnnotationStore()
        store.addAnnotation({ id: 'a', pageNumber: 1 } as any)
        store.addAnnotation({ id: 'b', pageNumber: 1 } as any)
        store.addAnnotation({ id: 'c', pageNumber: 3 } as any)
        await wrapper.vm.$nextTick()

        expect(eventBus.dispatch).toHaveBeenLastCalledWith(
            NAVIGATION_PAGE_MARKERS_CHANGED_EVENT,
            {
                source: 'inklayer-annotator',
                markers: new Map([[1, 2], [3, 1]])
            }
        )

        store.updateAnnotation('c', { pageNumber: 2 })
        store.removeAnnotation('b')
        await wrapper.vm.$nextTick()
        expect(eventBus.dispatch).toHaveBeenLastCalledWith(
            NAVIGATION_PAGE_MARKERS_CHANGED_EVENT,
            {
                source: 'inklayer-annotator',
                markers: new Map([[1, 1], [2, 1]])
            }
        )

        wrapper.unmount()
        expect(eventBus.dispatch).toHaveBeenLastCalledWith(
            NAVIGATION_PAGE_MARKERS_CHANGED_EVENT,
            { source: 'inklayer-annotator', markers: new Map() }
        )
    })
})
