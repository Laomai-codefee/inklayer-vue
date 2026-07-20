import { computed, ref, shallowRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PdfViewerContextKey, UserContextKey, type PdfViewerContextValue } from '@/context/pdfViewerContext'

const painterMocks = vi.hoisted(() => ({
    instances: [] as any[],
    resolveAnnotations: null as null | (() => void)
}))

vi.mock('@/extensions/annotator/painter', () => ({
    Painter: class MockPainter {
        options: Record<string, unknown>
        initWebSelection = vi.fn()
        destroy = vi.fn()
        activate = vi.fn()
        reRenderAnnotations = vi.fn()
        getKonvaCanvasStore = vi.fn(() => new Map([[1, {}]]))
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
    default: { template: '<div />', methods: { setMenuBarPainter() {}, open() {}, close() {} } }
}))

import AnnotatorExtension from '../AnnotatorExtension.vue'

describe('AnnotatorExtension lifecycle', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        painterMocks.instances.length = 0
        painterMocks.resolveAnnotations = null
    })

    it('does not rerender after unmount while annotations are still loading', async () => {
        const eventBus = {
            on: vi.fn(),
            off: vi.fn(),
            _on: vi.fn(),
            _off: vi.fn()
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
})
