import { describe, expect, it, vi } from 'vitest'
import { AnnotationType, PdfjsAnnotationType, type IAnnotationStore } from '../../const/definitions'
import { getAnnotationControlPermissions } from '../control_permissions'

const annotation: IAnnotationStore = {
  id: 'annotation-1',
  pageNumber: 1,
  konvaString: '{}',
  konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
  title: 'Alice',
  type: AnnotationType.RECTANGLE,
  subtype: 'Square',
  pdfjsType: PdfjsAnnotationType.SQUARE,
  date: null,
  comments: [],
  user: { id: 'alice', name: 'Alice' },
  native: false,
}

describe('getAnnotationControlPermissions', () => {
  it('keeps only the comment control for a non-owner', () => {
    const check = vi.fn((action: string) => action === 'annotation.comment')

    expect(getAnnotationControlPermissions(check, annotation)).toEqual({
      comment: true,
      edit: false,
      delete: false,
    })
  })

  it('hides every mutation control in read-only mode', () => {
    expect(getAnnotationControlPermissions(() => false, annotation)).toEqual({
      comment: false,
      edit: false,
      delete: false,
    })
  })
})
