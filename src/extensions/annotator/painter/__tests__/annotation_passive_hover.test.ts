import type Konva from 'konva'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { AnnotationPassiveHover } from '../annotation_passive_hover'
import { SHAPE_GROUP_NAME } from '../const'

function createPointerEvent({
  clientX = 50,
  clientY = 60,
  buttons = 0,
  pointerType = 'mouse',
}: {
  clientX?: number
  clientY?: number
  buttons?: number
  pointerType?: string
} = {}): PointerEvent {
  const event = new MouseEvent('pointermove', {
    bubbles: true,
    clientX,
    clientY,
    buttons,
  })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  return event as PointerEvent
}

describe('AnnotationPassiveHover', () => {
  let frameCallbacks: FrameRequestCallback[]

  beforeEach(() => {
    frameCallbacks = []
    vi.spyOn(window, 'requestAnimationFrame')
      .mockImplementation(callback => {
        frameCallbacks.push(callback)
        return frameCallbacks.length
      })
    vi.spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.replaceChildren()
  })

  function flushFrame(): void {
    frameCallbacks.shift()?.(0)
  }

  function setup() {
    const pageElement = document.createElement('div')
    const stageContainer = document.createElement('div')
    pageElement.appendChild(stageContainer)
    document.body.appendChild(pageElement)
    vi.spyOn(stageContainer, 'getBoundingClientRect').mockReturnValue({
      x: 10,
      y: 20,
      left: 10,
      top: 20,
      right: 210,
      bottom: 420,
      width: 200,
      height: 400,
      toJSON: () => ({}),
    })

    const group = { id: () => 'annotation-1' }
    const shape = {
      findAncestor: vi.fn(() => group),
    }
    const getIntersection = vi.fn((): typeof shape | null => shape)
    const stage = {
      container: () => stageContainer,
      width: () => 400,
      height: () => 800,
      getLayers: () => [{}],
      getIntersection,
    } as unknown as Konva.Stage
    const onHoverStart = vi.fn()
    const onHoverEnd = vi.fn()
    let suppressed = false
    const hover = new AnnotationPassiveHover({
      shouldSuppress: () => suppressed,
      onHoverStart,
      onHoverEnd,
    })
    hover.registerPage(1, pageElement, stage)

    return {
      pageElement,
      stageContainer,
      shape,
      getIntersection,
      onHoverStart,
      onHoverEnd,
      hover,
      setSuppressed: (value: boolean) => {
        suppressed = value
      },
    }
  }

  it('coalesces moves and resolves the topmost group in stage coordinates', () => {
    const {
      pageElement,
      stageContainer,
      shape,
      getIntersection,
      onHoverStart,
      onHoverEnd,
      hover,
    } = setup()

    const firstEvent = createPointerEvent({ clientX: 30, clientY: 40 })
    const latestEvent = createPointerEvent({ clientX: 60, clientY: 120 })
    pageElement.dispatchEvent(firstEvent)
    pageElement.dispatchEvent(latestEvent)

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)
    expect(firstEvent.defaultPrevented).toBe(false)
    flushFrame()

    expect(getIntersection).toHaveBeenCalledWith({ x: 100, y: 200 })
    expect(shape.findAncestor).toHaveBeenCalledWith(`.${SHAPE_GROUP_NAME}`)
    expect(onHoverStart).toHaveBeenCalledWith('annotation-1')

    pageElement.dispatchEvent(createPointerEvent({ clientX: 60, clientY: 120 }))
    flushFrame()
    expect(onHoverStart).toHaveBeenCalledTimes(1)

    stageContainer.dispatchEvent(new MouseEvent('pointerleave'))
    expect(onHoverEnd).not.toHaveBeenCalled()
    pageElement.dispatchEvent(new MouseEvent('pointerleave'))
    expect(onHoverEnd).toHaveBeenCalledWith('annotation-1')

    hover.destroy()
  })

  it('suppresses dragging, touch, text selection, and outside points', () => {
    const {
      pageElement,
      getIntersection,
      onHoverStart,
      onHoverEnd,
      hover,
      setSuppressed,
    } = setup()

    pageElement.dispatchEvent(createPointerEvent())
    flushFrame()
    expect(onHoverStart).toHaveBeenCalledTimes(1)

    pageElement.dispatchEvent(createPointerEvent({ buttons: 1 }))
    expect(onHoverEnd).toHaveBeenCalledWith('annotation-1')

    pageElement.dispatchEvent(createPointerEvent({ pointerType: 'touch' }))
    expect(onHoverStart).toHaveBeenCalledTimes(1)

    setSuppressed(true)
    pageElement.dispatchEvent(createPointerEvent())
    expect(onHoverStart).toHaveBeenCalledTimes(1)

    setSuppressed(false)
    pageElement.dispatchEvent(createPointerEvent({ clientX: 500, clientY: 500 }))
    flushFrame()
    expect(getIntersection).toHaveBeenCalledTimes(1)

    hover.destroy()
  })

  it('clears blank hits and cancels pending work on page replacement', () => {
    const {
      pageElement,
      getIntersection,
      onHoverStart,
      onHoverEnd,
      hover,
    } = setup()

    pageElement.dispatchEvent(createPointerEvent())
    flushFrame()
    expect(onHoverStart).toHaveBeenCalledTimes(1)

    getIntersection.mockReturnValueOnce(null)
    pageElement.dispatchEvent(createPointerEvent())
    flushFrame()
    expect(onHoverEnd).toHaveBeenCalledWith('annotation-1')

    pageElement.dispatchEvent(createPointerEvent())
    hover.unregisterPage(1)
    expect(window.cancelAnimationFrame).toHaveBeenCalled()

    flushFrame()
    expect(onHoverStart).toHaveBeenCalledTimes(1)
    hover.destroy()
  })
})
