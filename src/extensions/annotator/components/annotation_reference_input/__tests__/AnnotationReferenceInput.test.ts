import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
} from '../../../const/definitions'
import AnnotationReferenceInput from '../AnnotationReferenceInput.vue'

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

function mountInput(
  props: Partial<InstanceType<typeof AnnotationReferenceInput>['$props']> = {}
) {
  return mount(AnnotationReferenceInput, {
    attachTo: document.body,
    props: {
      annotations,
      excludeAnnotationId: 'annotation-1',
      ...props,
    },
  })
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('AnnotationReferenceInput', () => {
  it('does not propagate editor clicks to its annotation card', async () => {
    const onCardClick = vi.fn()
    const host = document.createElement('div')
    host.addEventListener('click', onCardClick)
    document.body.appendChild(host)
    const wrapper = mount(AnnotationReferenceInput, {
      attachTo: host,
      props: {
        annotations,
        excludeAnnotationId: 'annotation-1',
      },
    })

    await wrapper.get('textarea').trigger('click')
    await wrapper.get('button').trigger('click')

    expect(onCardClick).not.toHaveBeenCalled()
  })

  it('opens on #, supports keyboard selection, and inserts structured metadata', async () => {
    const wrapper = mountInput()
    const textarea = wrapper.get('textarea')

    await textarea.setValue('#')
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull()
    expect(document.body.querySelectorAll('[role="option"]')).toHaveLength(2)
    expect(document.body.querySelector('[role="option"]')?.getAttribute('aria-selected'))
      .toBe('true')

    await textarea.trigger('keydown', { key: 'ArrowDown' })
    const options = document.body.querySelectorAll('[role="option"]')
    expect(options[0].getAttribute('aria-selected')).toBe('false')
    expect(options[1].getAttribute('aria-selected')).toBe('true')

    await textarea.trigger('keydown', { key: 'Enter' })
    expect((textarea.element as HTMLTextAreaElement).value).toBe('#3 ')

    await textarea.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('submit')?.[0]).toEqual([{
      content: '#3 ',
      references: [{
        type: 'annotation',
        annotationId: 'annotation-3',
        label: '#3',
      }],
    }])
  })

  it('keeps a manually typed label as plain text after dismissing the menu', async () => {
    const wrapper = mountInput()
    const textarea = wrapper.get('textarea')

    await textarea.setValue('#2')
    await textarea.trigger('keydown', { key: 'Escape' })
    await textarea.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')?.[0]).toEqual([{
      content: '#2',
      references: undefined,
    }])
  })

  it('inserts at the caret without replacing surrounding text', async () => {
    const wrapper = mountInput({ initialContent: 'See  now.' })
    const textarea = wrapper.get('textarea')
    const element = textarea.element as HTMLTextAreaElement

    await textarea.setValue('See # now.')
    element.setSelectionRange(5, 5)
    await textarea.trigger('click')
    await textarea.trigger('keydown', { key: 'Enter' })

    expect(element.value).toBe('See #2 now.')
    expect(element.selectionStart).toBe(6)
  })

  it('supports pointer selection and preserves Shift+Enter for a newline', async () => {
    const wrapper = mountInput()
    const textarea = wrapper.get('textarea')

    await textarea.setValue('#Ali')
    document.body.querySelector<HTMLElement>('[role="option"]')?.click()
    await nextTick()

    expect((textarea.element as HTMLTextAreaElement).value).toBe('#2 ')
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('preserves Shift+Enter and ignores Enter during IME composition', async () => {
    const wrapper = mountInput()
    const textarea = wrapper.get('textarea')

    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })
    await textarea.trigger('compositionstart')
    await textarea.setValue('批注')
    await textarea.trigger('keydown', { key: 'Enter', isComposing: true })

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('cancels only after focus leaves the complete editor', async () => {
    const wrapper = mountInput()
    const textarea = wrapper.get('textarea')
    const confirm = wrapper.get('button')
    const outside = document.createElement('button')
    document.body.appendChild(outside)

    ;(textarea.element as HTMLTextAreaElement).focus()
    ;(confirm.element as HTMLButtonElement).focus()
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(wrapper.emitted('cancel')).toBeUndefined()

    outside.focus()
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('uses selected source text when the candidate has no authored content', async () => {
    const wrapper = mountInput({
      annotations: [
        annotations[0],
        makeAnnotation('annotation-2', 2, {
          contentsObj: { text: '', selectedText: 'Quoted source text' },
        }),
      ],
    })

    await wrapper.get('textarea').setValue('#')

    expect(document.body.textContent).toContain('Quoted source text')
  })

  it('cleans stale metadata when the visible label is deleted', async () => {
    const wrapper = mountInput({
      initialContent: 'See #2.',
      initialReferences: [{
        type: 'annotation',
        annotationId: 'annotation-2',
        label: '#2',
      }],
    })
    const textarea = wrapper.get('textarea')

    await textarea.setValue('See it.')
    await textarea.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')?.[0]).toEqual([{
      content: 'See it.',
      references: undefined,
    }])
  })
})
