import Konva from 'konva'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
} from '../../../const/definitions'
import { SHAPE_GROUP_NAME } from '../../const'
import type { KonvaCanvas } from '../../index'
import { Selector } from '../selector'
import { getTransformerPermissionStyle } from '../selector_permissions'

describe('getTransformerPermissionStyle', () => {
  it('shows the selection border and resize anchors when transform is allowed', () => {
    expect(getTransformerPermissionStyle(true)).toEqual({
      borderStrokeWidth: 2,
      borderDash: [],
      opacity: 1,
      authorLabelOpacity: 1,
      anchorFill: '#fff',
      anchorStrokeWidth: 2,
      anchorSize: 10,
    })
  })

  it('keeps the selection border visible while hiding resize anchors when transform is denied', () => {
    expect(getTransformerPermissionStyle(false)).toEqual({
      borderStrokeWidth: 2,
      borderDash: [6, 4],
      opacity: 0.5,
      authorLabelOpacity: 0.8,
      anchorFill: 'transparent',
      anchorStrokeWidth: 0,
      anchorSize: 0,
    })
  })
})

describe('Selector permission interaction', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it.each([
    ['editable', true, true, true, [], 1],
    ['read-only', false, false, false, [6, 4], 0.5],
  ] as const)(
    'keeps an annotation selectable while applying the %s transform state',
    (_state, allowed, draggable, resizeEnabled, borderDash, opacity) => {
      const container = document.createElement('div')
      document.body.appendChild(container)
      const stage = new Konva.Stage({ container, width: 600, height: 800 })
      const layer = new Konva.Layer()
      const group = new Konva.Group({ id: 'annotation-1', name: SHAPE_GROUP_NAME })
      group.add(new Konva.Rect({ x: 40, y: 60, width: 120, height: 50 }))
      layer.add(group)
      stage.add(layer)

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
        konvaString: group.toJSON(),
        konvaClientRect: group.getClientRect(),
        native: false,
      }
      const onSelected = vi.fn()
      const canvas: KonvaCanvas = {
        pageNumber: 1,
        konvaStage: stage,
        wrapper: container,
        isActive: false,
      }
      const selector = new Selector({
        primaryColor: '#6e56cf',
        konvaCanvasStore: new Map([[1, canvas]]),
        getAnnotationStore: () => annotation,
        canTransform: () => allowed,
        onSelected,
        onSelectionChanged: vi.fn(),
        onCancel: vi.fn(),
        onChanged: vi.fn(),
        onDelete: vi.fn(),
      })

      selector.select(annotation.id, true)
      selector.activate(1)

      const transformer = layer.getChildren().find(node => node instanceof Konva.Transformer) as Konva.Transformer
      expect(onSelected).toHaveBeenCalledWith(annotation.id, true, expect.any(Object))
      expect(group.draggable()).toBe(draggable)
      expect(transformer.resizeEnabled()).toBe(resizeEnabled)
      expect(transformer.borderDash()).toEqual(borderDash)
      expect(transformer.opacity()).toBe(opacity)

      selector.clear()
      stage.destroy()
    },
  )
})
