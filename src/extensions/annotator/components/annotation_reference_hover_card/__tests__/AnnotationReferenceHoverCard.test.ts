import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
} from '../../../const/definitions'
import AnnotationReferenceHoverCard from '../AnnotationReferenceHoverCard.vue'

function makeAnnotation(
  overrides: Partial<IAnnotationStore> = {}
): IAnnotationStore {
  return {
    id: 'annotation-2',
    referenceNumber: 2,
    pageNumber: 8,
    konvaString: '{}',
    konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
    title: 'Alice',
    type: AnnotationType.RECTANGLE,
    color: '#000000',
    subtype: 'Square',
    pdfjsType: PdfjsAnnotationType.SQUARE,
    date: null,
    contentsObj: {
      text: 'Important context from the annotation.',
      selectedText: 'Quoted source text.',
    },
    comments: [{
      id: 'reply-1',
      title: 'Bob',
      date: null,
      content: 'A reply',
    }],
    user: { id: 'alice', name: 'Alice' },
    native: false,
    ...overrides,
  }
}

const passthroughStub = {
  template: '<div><slot /></div>',
}

function mountCard(
  annotation: IAnnotationStore,
  attachTo?: HTMLElement
) {
  return mount(AnnotationReferenceHoverCard, {
    attachTo,
    props: { annotation },
    slots: { default: '<button type="button">#2</button>' },
    global: {
      stubs: {
        HoverCardRoot: passthroughStub,
        HoverCardTrigger: passthroughStub,
        HoverCardPortal: passthroughStub,
        HoverCardContent: passthroughStub,
      },
    },
  })
}

describe('AnnotationReferenceHoverCard', () => {
  it('shows identity, source text, comment, page, and reply count', () => {
    const wrapper = mountCard(makeAnnotation())

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Quoted source text.')
    expect(wrapper.text()).toContain('Important context from the annotation.')
    expect(wrapper.text()).toContain('8')
    expect(wrapper.text()).toContain('1')
  })

  it('shows an empty state without rendering a reply summary', () => {
    const wrapper = mountCard(makeAnnotation({
      contentsObj: { text: '  ', selectedText: '  ' },
      comments: [],
    }))

    expect(wrapper.find('.annotation-reference-hover-card__empty').exists()).toBe(true)
    expect(wrapper.find('.annotation-reference-hover-card__footer').exists()).toBe(false)
  })

  it('only activates the preview number and stops card click propagation', async () => {
    const onParentClick = vi.fn()
    const host = document.createElement('div')
    host.addEventListener('click', onParentClick)
    document.body.appendChild(host)
    const wrapper = mountCard(makeAnnotation(), host)

    await wrapper.get('.annotation-reference-hover-card__preview').trigger('click')
    expect(wrapper.emitted('activate')).toBeUndefined()
    expect(onParentClick).not.toHaveBeenCalled()

    await wrapper.get('button.annotation-reference-hover-card__number').trigger('click')
    expect(wrapper.emitted('activate')?.[0]).toEqual(['annotation-2'])
    expect(onParentClick).not.toHaveBeenCalled()

    wrapper.unmount()
    host.remove()
  })
})
