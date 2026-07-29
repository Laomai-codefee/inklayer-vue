import { describe, expect, it } from 'vitest'

import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
} from '../../../const/definitions'
import {
  filterAnnotationReferenceCandidates,
  findAnnotationReferenceQuery,
  MAX_REFERENCE_CANDIDATES,
} from '../reference_query'

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
    date: null,
    contentsObj: { text: `Annotation ${referenceNumber} summary` },
    comments: [],
    user: { id: `user-${referenceNumber}`, name: `Author ${referenceNumber}` },
    native: false,
    ...overrides,
  }
}

const annotations = [
  makeAnnotation('annotation-1', 1),
  makeAnnotation('annotation-2', 2, { title: 'Alice' }),
  makeAnnotation('annotation-3', 3, {
    pageNumber: 8,
    subtype: 'Highlight',
    contentsObj: { text: 'Revenue needs review' },
  }),
]

describe('annotation reference query', () => {
  it('finds the active query at the caret', () => {
    expect(findAnnotationReferenceQuery('See #Ali', 8)).toEqual({
      start: 4,
      end: 8,
      query: 'Ali',
    })
    expect(findAnnotationReferenceQuery('#', 1)).toEqual({
      start: 0,
      end: 1,
      query: '',
    })
  })

  it('does not trigger inside a word or after unsupported query characters', () => {
    expect(findAnnotationReferenceQuery('issue#2', 7)).toBeNull()
    expect(findAnnotationReferenceQuery('参考#2', 4)).toBeNull()
    expect(findAnnotationReferenceQuery('See #Alice Smith', 16)).toBeNull()
    expect(findAnnotationReferenceQuery('参考：#2', 5)).toEqual({
      start: 3,
      end: 5,
      query: '2',
    })
  })

  it('filters all supported fields and excludes the current annotation', () => {
    expect(filterAnnotationReferenceCandidates(annotations, '', 'annotation-1').map(({ id }) => id))
      .toEqual(['annotation-2', 'annotation-3'])
    expect(filterAnnotationReferenceCandidates(annotations, '#2', 'annotation-1').map(({ id }) => id))
      .toEqual(['annotation-2'])
    expect(filterAnnotationReferenceCandidates(annotations, 'Alice', 'annotation-1').map(({ id }) => id))
      .toEqual(['annotation-2'])
    expect(filterAnnotationReferenceCandidates(annotations, '8', 'annotation-1').map(({ id }) => id))
      .toEqual(['annotation-3'])
    expect(filterAnnotationReferenceCandidates(annotations, 'Highlight', 'annotation-1').map(({ id }) => id))
      .toEqual(['annotation-3'])
    expect(filterAnnotationReferenceCandidates(annotations, 'Revenue', 'annotation-1').map(({ id }) => id))
      .toEqual(['annotation-3'])
  })

  it('sorts by reference number and limits the result count', () => {
    const many = Array.from(
      { length: MAX_REFERENCE_CANDIDATES + 5 },
      (_, index) => makeAnnotation(`annotation-${index + 1}`, MAX_REFERENCE_CANDIDATES + 5 - index)
    )
    const result = filterAnnotationReferenceCandidates(many, '', 'missing')

    expect(result).toHaveLength(MAX_REFERENCE_CANDIDATES)
    expect(result.map(annotation => annotation.referenceNumber))
      .toEqual(Array.from({ length: MAX_REFERENCE_CANDIDATES }, (_, index) => index + 1))
  })
})
