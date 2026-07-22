import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Painter } from '..'
import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
  type IAnnotationType,
} from '../../const/definitions'
import type { AnnotationPermissions } from '../../types/annotator'
import type { User } from '@/types'

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
  notifyPainterChanged: vi.fn(),
}

function createPainter(allowed: boolean) {
  const painter = Object.create(Painter.prototype) as Painter
  Object.assign(painter as unknown as Record<string, unknown>, {
    permissionController: { can: vi.fn(() => allowed) },
    store,
    selector: { delete: vi.fn(), clear: vi.fn(), select: vi.fn(), refreshCurrentSelection: vi.fn() },
    authorLabels: {
      refreshAnnotation: vi.fn(),
      refreshAll: vi.fn(),
      refreshPage: vi.fn(),
      remove: vi.fn(),
      destroy: vi.fn(),
      setSelected: vi.fn(),
      areAllVisible: vi.fn(() => false),
      setAllVisible: vi.fn(),
    },
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

function createCollaborativePainter(currentUser: User, permissions: AnnotationPermissions) {
  const painter = createPainter(false)
  Object.assign(painter as unknown as Record<string, unknown>, {
    currentUser,
    annotationPermissions: permissions,
  })
  const permissionController = {
    can: vi.fn((action: string, target?: IAnnotationStore) => {
      const user = (painter as unknown as { currentUser: User }).currentUser
      const activePermissions = (painter as unknown as { annotationPermissions?: AnnotationPermissions }).annotationPermissions
      const defaultAllowed = activePermissions?.mode !== 'owner-only'
        ? true
        : action === 'annotation.create' || action === 'annotation.comment'
          ? Boolean(user.id && user.id !== 'null')
          : user.id === target?.user.id
      const override = activePermissions?.can?.({
        action: action as Parameters<NonNullable<AnnotationPermissions['can']>>[0]['action'],
        currentUser: user,
        defaultAllowed,
      })
      return override ?? defaultAllowed
    }),
  }
  Object.assign(painter as unknown as Record<string, unknown>, { permissionController })
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

  it('enforces the Alice, Bob, and admin collaboration flow through public mutations', () => {
    const ownerOnly = { mode: 'owner-only' as const }
    const alice = createCollaborativePainter({ id: 'alice', name: 'Alice' }, ownerOnly)
    const bob = createCollaborativePainter({ id: 'bob', name: 'Bob' }, ownerOnly)
    const admin = createCollaborativePainter(
      { id: 'admin', name: 'Admin' },
      {
        mode: 'owner-only',
        can: ({ currentUser }) => currentUser?.id === 'admin' ? true : undefined,
      },
    )

    expect(alice.update(annotation.id, { title: 'Alice edited' })).toBeDefined()
    expect(bob.update(annotation.id, { title: 'Bob edited' })).toBeUndefined()
    expect(bob.update(annotation.id, { comments: [] }, 'annotation.comment')).toBeDefined()
    expect(bob.delete(annotation.id, true)).toBe(false)
    expect(admin.update(annotation.id, { title: 'Admin edited' })).toBeDefined()
    expect(admin.delete(annotation.id, true)).toBe(true)
  })

  it('updates the current user and permissions without recreating the painter', () => {
    const painter = createCollaborativePainter(
      { id: 'alice', name: 'Alice' },
      { mode: 'owner-only' },
    )
    const editor = { setCurrentUser: vi.fn() }
    ;(painter as unknown as { editorStore: Map<string, typeof editor> }).editorStore.set('editor', editor)

    painter.setPermissionContext({ id: 'bob', name: 'Bob' }, { can: () => false })

    expect(painter.can('annotation.edit', annotation)).toBe(false)
    expect(editor.setCurrentUser).toHaveBeenCalledWith({ id: 'bob', name: 'Bob' })
    expect((painter as unknown as { selector: { refreshCurrentSelection: ReturnType<typeof vi.fn> } }).selector.refreshCurrentSelection).toHaveBeenCalledOnce()
    expect((painter as unknown as { authorLabels: { refreshAll: ReturnType<typeof vi.fn> } }).authorLabels.refreshAll).toHaveBeenCalledOnce()
    expect(store.notifyPainterChanged).toHaveBeenCalledOnce()
  })

  it('denies every public mutation in read-only mode while leaving selection outside the permission model', () => {
    const painter = createCollaborativePainter(
      { id: 'alice', name: 'Alice' },
      { can: () => false },
    )
    const rectangle = { type: AnnotationType.RECTANGLE } as IAnnotationType

    painter.selectAnnotation(annotation.id, true)
    expect(painter.update(annotation.id, { title: 'Blocked' })).toBeUndefined()
    expect(painter.delete(annotation.id, true)).toBe(false)
    painter.activate(rectangle, null)
    painter.highlightRange(null, rectangle)

    expect(store.updateAnnotation).not.toHaveBeenCalled()
    expect(store.removeAnnotation).not.toHaveBeenCalled()
    expect((painter as unknown as { selector: { select: ReturnType<typeof vi.fn> } }).selector.select)
      .toHaveBeenCalledWith(annotation.id, true)
    expect((painter as unknown as { webSelection: { highlight: ReturnType<typeof vi.fn> } }).webSelection.highlight).not.toHaveBeenCalled()
  })
})
