import Konva from 'konva'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  annotationDefinitions,
  AnnotationType,
  type IAnnotationStore,
} from '../../../const/definitions'
import type { IEditorOptions } from '../editor'
import { EditorHighLight } from '../editor_highlight'

vi.mock('../../../utils/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../utils/utils')>()
  return {
    ...actual,
    formatTimestamp: vi.fn(() => ''),
    generateUUID: vi.fn(() => 'generated-id'),
  }
})

function createStage(): Konva.Stage {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const stage = new Konva.Stage({ container, width: 600, height: 800 })
  stage.add(new Konva.Layer())
  return stage
}

function setRect(
  element: HTMLElement,
  rect: { x: number; y: number; width: number; height: number }
) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    ...rect,
    top: rect.y,
    left: rect.x,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
    toJSON: () => rect,
  } as DOMRect)
}

describe('EditorHighLight annotation content', () => {
  afterEach(() => {
    document.body.replaceChildren()
    vi.restoreAllMocks()
  })

  it.each([
    AnnotationType.HIGHLIGHT,
    AnnotationType.UNDERLINE,
    AnnotationType.STRIKEOUT,
  ])('separates selected source text from user content for type %s', (type) => {
    const stage = createStage()
    const onAdd = vi.fn<[IAnnotationStore], void>()
    const annotation = annotationDefinitions.find(definition => definition.type === type)!
    const options: IEditorOptions = {
      primaryColor: '#6e56cf',
      defaultOptions: {} as IEditorOptions['defaultOptions'],
      currentUser: { id: 'alice', name: 'Alice' },
      pdfViewerApplication: {} as IEditorOptions['pdfViewerApplication'],
      konvaStage: stage,
      pageNumber: 1,
      annotation,
      onAdd,
      onChange: vi.fn(),
    }
    const editor = new EditorHighLight(options, type)
    const wrapper = document.createElement('div')
    const first = document.createElement('span')
    const second = document.createElement('span')
    first.textContent = 'A source passage '
    second.textContent = 'that remains complete after sixty characters are selected by the user.'
    setRect(wrapper, { x: 0, y: 0, width: 600, height: 800 })
    setRect(first, { x: 20, y: 30, width: 100, height: 16 })
    setRect(second, { x: 120, y: 30, width: 300, height: 16 })

    editor.convertTextSelection([first, second], wrapper)

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type,
      contentsObj: {
        text: '',
        selectedText: 'A source passage that remains complete after sixty characters are selected by the user.',
      },
    }))

    stage.destroy()
  })
})
