import { describe, expect, it } from 'vitest'

import { createAnnotationReferenceSegments } from '../reference_segments'

describe('createAnnotationReferenceSegments', () => {
  it('only turns metadata-backed labels into reference segments', () => {
    expect(createAnnotationReferenceSegments(
      'See #2 and manual #3.',
      [{
        type: 'annotation',
        annotationId: 'annotation-2',
        label: '#2',
      }]
    )).toEqual([
      { kind: 'text', value: 'See ' },
      {
        kind: 'reference',
        value: '#2',
        annotationId: 'annotation-2',
      },
      { kind: 'text', value: ' and manual #3.' },
    ])
  })

  it('does not match a shorter label inside a longer number', () => {
    expect(createAnnotationReferenceSegments(
      '#2 #20',
      [{
        type: 'annotation',
        annotationId: 'annotation-2',
        label: '#2',
      }]
    )).toEqual([
      { kind: 'reference', value: '#2', annotationId: 'annotation-2' },
      { kind: 'text', value: ' #20' },
    ])
  })

  it('preserves plain text and line breaks when there are no references', () => {
    expect(createAnnotationReferenceSegments('First\nSecond', undefined))
      .toEqual([{ kind: 'text', value: 'First\nSecond' }])
  })
})
