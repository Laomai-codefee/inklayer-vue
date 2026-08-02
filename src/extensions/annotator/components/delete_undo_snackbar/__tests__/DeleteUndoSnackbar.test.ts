import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnnotationStore } from '@/stores/annotationStore'
import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
} from '../../../const/definitions'
import type { Painter } from '../../../painter'
import { DELETE_UNDO_DURATION_MS, type DeleteUndoSnapshot } from '../../../painter/delete_undo'
import DeleteUndoSnackbar from '../DeleteUndoSnackbar.vue'
import { getDeleteUndoMessage, getDeleteUndoMessageSegments } from '../message'

function makeAnnotation(referenceNumber: number): IAnnotationStore {
  return {
    id: `annotation-${referenceNumber}`,
    referenceNumber,
    pageNumber: 3,
    konvaString: '{}',
    konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
    title: 'Alice',
    type: AnnotationType.RECTANGLE,
    color: '#000000',
    subtype: 'Square',
    pdfjsType: PdfjsAnnotationType.SQUARE,
    date: null,
    contentsObj: { text: '请调整这里的内容' },
    comments: [],
    user: { id: 'alice', name: 'Alice' },
    native: false,
  }
}

function createSnapshot(): DeleteUndoSnapshot {
  return {
    annotationCount: 1,
    commentCount: 0,
    totalCount: 1,
    expiresAt: Date.now() + DELETE_UNDO_DURATION_MS,
    items: [{
      kind: 'annotation',
      previewAnnotation: makeAnnotation(12),
      annotationReferenceNumber: 12,
      annotationType: AnnotationType.RECTANGLE,
      pageNumber: 3,
      content: '请调整这里的内容',
    }],
  }
}

describe('DeleteUndoSnackbar', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('renders inside InkLayer and delegates timer controls and restore', async () => {
    const snapshot = createSnapshot()
    const painter = {
      subscribeDeleteUndo: vi.fn(() => () => {}),
      getDeleteUndoSnapshot: vi.fn(() => snapshot),
      pauseDeleteUndo: vi.fn(),
      resumeDeleteUndo: vi.fn(),
      undoDelete: vi.fn(),
    } as unknown as Painter
    useAnnotationStore().setPainter(painter)
    const container = document.createElement('div')
    container.id = 'InkLayer'
    document.body.appendChild(container)

    const wrapper = mount(DeleteUndoSnackbar, {
      attachTo: container,
      global: {
        stubs: {
          AnnotationReferenceHoverCard: {
            template: '<span><slot /></span>',
          },
        },
      },
    })

    expect(container.contains(wrapper.get('[role="status"]').element)).toBe(true)
    expect(wrapper.text()).toContain('已删除 #12 · “请调整这里的内容”')
    await wrapper.get('[role="status"]').trigger('mouseenter')
    await wrapper.get('[role="status"]').trigger('mouseleave')
    await wrapper.get('.delete-undo-restore').trigger('click')

    expect(painter.pauseDeleteUndo).toHaveBeenCalledOnce()
    expect(painter.resumeDeleteUndo).toHaveBeenCalledOnce()
    expect(painter.undoDelete).toHaveBeenCalledOnce()
    wrapper.unmount()
    container.remove()
  })

  it('identifies the parent annotation and truncates deleted comment content', () => {
    const translate = vi.fn((key: string) => key)
    const snapshot: DeleteUndoSnapshot = {
      annotationCount: 0,
      commentCount: 1,
      totalCount: 1,
      expiresAt: Date.now() + DELETE_UNDO_DURATION_MS,
      items: [{
        kind: 'comment',
        previewAnnotation: makeAnnotation(18),
        previewComment: {
          id: 'comment-1', title: 'Alice', date: null, content: 'Deleted comment',
        },
        annotationReferenceNumber: 18,
        content: '  这是一条需要被压缩空格并且长度超过二十四个字符的评论内容  ',
        author: 'Alice',
      }],
    }

    getDeleteUndoMessage(snapshot, translate, 'zh-CN')

    expect(translate).toHaveBeenLastCalledWith(
      'annotator.deleteUndo.commentDeletedDetailed',
      {
        reference: ' #18',
        detail: '“这是一条需要被压缩空格并且长度超过二十四个字符的…”',
      },
    )
  })

  it('carries deleted comments into the parent annotation hover reference', () => {
    const annotation = makeAnnotation(18)
    const previewComment = {
      id: 'comment-1', title: 'Bob', date: null, content: 'Deleted comment',
    }
    const segments = getDeleteUndoMessageSegments('已删除 #18 的评论', [{
      kind: 'comment',
      previewAnnotation: annotation,
      previewComment,
      annotationReferenceNumber: 18,
    }])

    expect(segments.find(segment => segment.kind === 'reference')).toEqual({
      kind: 'reference',
      value: '#18',
      annotation,
      comments: [previewComment],
    })
  })
})
