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
      borderDash: [3, 3],
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
    ['read-only', false, false, false, [3, 3], 0.5],
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
        onHoverStart: vi.fn(),
        onHoverEnd: vi.fn(),
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

  it('reports group hover once, clears it before selection, and ignores touch', () => {
    const inkLayer = document.createElement('div')
    inkLayer.id = 'InkLayer'
    const container = document.createElement('div')
    inkLayer.appendChild(container)
    document.body.appendChild(inkLayer)
    const stage = new Konva.Stage({ container, width: 600, height: 800 })
    const layer = new Konva.Layer()
    const group = new Konva.Group({
      id: 'annotation-1',
      name: SHAPE_GROUP_NAME,
    })
    group.add(new Konva.Rect({ x: 40, y: 60, width: 120, height: 50 }))
    group.add(new Konva.Line({ points: [40, 60, 160, 110] }))
    const secondGroup = new Konva.Group({
      id: 'annotation-2',
      name: SHAPE_GROUP_NAME,
    })
    secondGroup.add(new Konva.Rect({ x: 200, y: 160, width: 80, height: 40 }))
    layer.add(group)
    layer.add(secondGroup)
    stage.add(layer)

    const onHoverStart = vi.fn()
    const onHoverEnd = vi.fn()
    const selector = new Selector({
      primaryColor: '#6e56cf',
      konvaCanvasStore: new Map([[
        1,
        {
          pageNumber: 1,
          konvaStage: stage,
          wrapper: container,
          isActive: false,
        },
      ]]),
      getAnnotationStore: vi.fn(),
      canTransform: () => true,
      onSelected: vi.fn(),
      onSelectionChanged: vi.fn(),
      onHoverStart,
      onHoverEnd,
      onCancel: vi.fn(),
      onChanged: vi.fn(),
      onDelete: vi.fn(),
    })

    selector.activate(1)
    group.fire('pointerenter', { evt: { pointerType: 'mouse' } })
    group.fire('pointerenter', { evt: { pointerType: 'mouse' } })
    expect(onHoverStart).toHaveBeenCalledOnce()
    expect(onHoverStart).toHaveBeenCalledWith(group.id())
    expect(inkLayer.classList.contains('InkLayer_Annotator_selector_hover')).toBe(true)

    secondGroup.fire('pointerenter', { evt: { pointerType: 'mouse' } })
    expect(onHoverStart).toHaveBeenLastCalledWith(secondGroup.id())
    group.fire('pointerleave', { evt: { pointerType: 'mouse' } })
    expect(onHoverEnd).not.toHaveBeenCalled()
    secondGroup.fire('pointerleave', { evt: { pointerType: 'mouse' } })
    expect(onHoverEnd).toHaveBeenCalledWith(secondGroup.id())

    group.fire('pointerenter', { evt: { pointerType: 'mouse' } })
    group.getChildren()[0].fire('pointerclick', { evt: { button: 0 } })
    expect(onHoverEnd).toHaveBeenLastCalledWith(group.id())
    expect(inkLayer.classList.contains('InkLayer_Annotator_selector_hover')).toBe(false)

    group.fire('pointerenter', { evt: { pointerType: 'touch' } })
    expect(onHoverStart).toHaveBeenCalledTimes(3)

    selector.clear()
    stage.destroy()
  })
})
