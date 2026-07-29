import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnnotationStore } from '@/stores/annotationStore'
import { Painter } from '..'
import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
} from '../../const/definitions'

function makeAnnotation(
  id: string,
  overrides: Partial<IAnnotationStore> = {}
): IAnnotationStore {
  return {
    id,
    pageNumber: 1,
    konvaString: '{}',
    konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
    title: 'Alice',
    type: AnnotationType.RECTANGLE,
    color: '#000000',
    subtype: 'Square',
    pdfjsType: PdfjsAnnotationType.SQUARE,
    date: null,
    contentsObj: { text: '' },
    comments: [],
    user: { id: 'alice', name: 'Alice' },
    native: false,
    ...overrides,
  }
}

interface NumberingPainter {
  initAnnotationsOnce: Painter['initAnnotationsOnce']
  getData: Painter['getData']
  saveToStore: (annotation: IAnnotationStore, isOriginal?: boolean) => void
}

function createPainter(): NumberingPainter {
  const painter = Object.create(Painter.prototype) as NumberingPainter
  Object.assign(painter as unknown as Record<string, unknown>, {
    nextAnnotationReferenceNumber: 1,
    store: useAnnotationStore(),
    permissionController: { can: vi.fn(() => true) },
    authorLabels: { refreshAnnotation: vi.fn() },
    onAnnotationAdd: vi.fn(),
    selectAnnotation: vi.fn(),
  })
  return painter
}

describe('Painter annotation reference numbering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    useAnnotationStore().clearAnnotations()
  })

  it('normalizes loaded annotations before data is saved', async () => {
    const painter = createPainter()

    await painter.initAnnotationsOnce([
      makeAnnotation('a', { referenceNumber: 1 }),
      makeAnnotation('b', { referenceNumber: 2 }),
      makeAnnotation('c'),
    ], false)

    expect(painter.getData().map(annotation => annotation.referenceNumber))
      .toEqual([1, 2, 3])
  })

  it('numbers new annotations before emitting and keeps the session high-water mark', async () => {
    const painter = createPainter()
    const store = useAnnotationStore()
    await painter.initAnnotationsOnce([
      makeAnnotation('a', { referenceNumber: 1 }),
      makeAnnotation('b', { referenceNumber: 2 }),
    ], false)

    painter.saveToStore(makeAnnotation('c'))
    store.removeAnnotation('c')
    painter.saveToStore(makeAnnotation('d'))

    const onAnnotationAdd = (painter as unknown as {
      onAnnotationAdd: ReturnType<typeof vi.fn>
    }).onAnnotationAdd
    expect(onAnnotationAdd.mock.calls.map(([annotation]) => annotation.referenceNumber))
      .toEqual([3, 4])
    expect(painter.getData().map(annotation => annotation.referenceNumber))
      .toEqual([1, 2, 4])
  })
})
