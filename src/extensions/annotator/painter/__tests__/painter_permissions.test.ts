import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Painter } from '..'
import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
  type IAnnotationType,
} from '../../const/definitions'

const annotation: IAnnotationStore = {
  id: 'annotation-1',
  pageNumber: 1,
  type: AnnotationType.RECTANGLE,
  pdfjsType: PdfjsAnnotationType.SQUARE,
  subtype: 'Square',
  title: 'Alice',
  date: null,
  user: { id: 'alice', name: 'Alice' },
  comments: [],
  konvaString: '{}',
  konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
  native: false,
}

const store = {
  getAnnotation: vi.fn(() => annotation),
  updateAnnotation: vi.fn((_id: string, updates: Partial<IAnnotationStore>) => ({ ...annotation, ...updates })),
  removeAnnotation: vi.fn(),
  setSelectedAnnotation: vi.fn(),
  setCurrentAnnotationType: vi.fn(),
}

function createPainter(allowed: boolean) {
  const painter = Object.create(Painter.prototype) as Painter
  Object.assign(painter as unknown as Record<string, unknown>, {
    permissionController: { can: vi.fn(() => allowed) },
    store,
    selector: { delete: vi.fn(), clear: vi.fn(), refreshCurrentSelection: vi.fn() },
    editorStore: new Map(),
    konvaCanvasStore: new Map(),
    onAnnotationChanged: vi.fn(),
    onAnnotationDelete: vi.fn(),
    webSelection: { highlight: vi.fn() },
    disablePainting: vi.fn(),
    setDefaultMode: vi.fn(),
  })
  return painter
}

describe('Painter permission guards', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('does not update or emit when a programmatic update is denied', () => {
    const painter = createPainter(false)

    const result = painter.update(annotation.id, { title: 'Changed' })

    expect(result).toBeUndefined()
    expect(store.updateAnnotation).not.toHaveBeenCalled()
    expect((painter as unknown as { onAnnotationChanged: ReturnType<typeof vi.fn> }).onAnnotationChanged).not.toHaveBeenCalled()
  })

  it('forwards comment metadata and emits only after an allowed update', () => {
    const painter = createPainter(true)
    const reply = { id: 'reply-1', title: 'Alice', date: null, content: 'Reply', user: annotation.user }

    const result = painter.update(annotation.id, { comments: [] }, 'comment.edit', reply)

    expect(result).toEqual(expect.objectContaining({ id: annotation.id, comments: [] }))
    expect((painter as unknown as { permissionController: { can: ReturnType<typeof vi.fn> } }).permissionController.can)
      .toHaveBeenCalledWith('comment.edit', annotation, reply)
    expect((painter as unknown as { onAnnotationChanged: ReturnType<typeof vi.fn> }).onAnnotationChanged).toHaveBeenCalledTimes(1)
  })

  it('does not delete, clear selection, or emit when deletion is denied', () => {
    const painter = createPainter(false)

    expect(painter.delete(annotation.id, true)).toBe(false)
    expect(store.removeAnnotation).not.toHaveBeenCalled()
    expect((painter as unknown as { selector: { delete: ReturnType<typeof vi.fn> } }).selector.delete).not.toHaveBeenCalled()
    expect((painter as unknown as { onAnnotationDelete: ReturnType<typeof vi.fn> }).onAnnotationDelete).not.toHaveBeenCalled()
  })

  it('blocks annotation tools and text highlighting when creation is denied', () => {
    const painter = createPainter(false)
    const rectangle = { type: AnnotationType.RECTANGLE } as IAnnotationType

    painter.activate(rectangle, null)
    painter.highlightRange(null, rectangle)

    expect((painter as unknown as { disablePainting: ReturnType<typeof vi.fn> }).disablePainting).toHaveBeenCalledTimes(1)
    expect((painter as unknown as { setDefaultMode: ReturnType<typeof vi.fn> }).setDefaultMode).toHaveBeenCalledTimes(1)
    expect((painter as unknown as { webSelection: { highlight: ReturnType<typeof vi.fn> } }).webSelection.highlight).not.toHaveBeenCalled()
  })
})
