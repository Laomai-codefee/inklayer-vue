import { describe, expect, it, vi } from 'vitest'
import { AnnotationType, PdfjsAnnotationType, type IAnnotationStore } from '../../const/definitions'
import { getAnnotationControlPermissions, hasAnnotationMenuControls } from '../control_permissions'

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

describe('hasAnnotationMenuControls', () => {
  it('hides the empty menu when commenting is the only permission and the sidebar is already open', () => {
    const permissions = { comment: true, edit: false, delete: false }

    expect(hasAnnotationMenuControls(permissions, true, true)).toBe(false)
    expect(hasAnnotationMenuControls(permissions, false, true)).toBe(true)
  })

  it('keeps edit or delete controls visible independently of the comment sidebar', () => {
    expect(hasAnnotationMenuControls({ comment: false, edit: true, delete: false }, true, true)).toBe(true)
    expect(hasAnnotationMenuControls({ comment: false, edit: true, delete: false }, true, false)).toBe(false)
    expect(hasAnnotationMenuControls({ comment: false, edit: false, delete: true }, true, false)).toBe(true)
  })
})
