import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import {
  AnnotationType,
  PdfjsAnnotationType,
  type IAnnotationStore,
} from '../../../const/definitions'
import AnnotationReferenceText from '../AnnotationReferenceText.vue'

function makeAnnotation(
  id: string,
  referenceNumber: number
): IAnnotationStore {
  return {
    id,
    referenceNumber,
    pageNumber: referenceNumber,
    konvaString: '{}',
    konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
    title: 'Alice',
    type: AnnotationType.RECTANGLE,
    color: '#000000',
    subtype: 'Square',
    pdfjsType: PdfjsAnnotationType.SQUARE,
    date: null,
    contentsObj: { text: '' },
    comments: [],
    user: { id: 'alice', name: 'Alice' },
    native: false,
  }
}

describe('AnnotationReferenceText', () => {
  it('uses the target current number and activates without selecting its parent', async () => {
    const onParentClick = vi.fn()
    const host = document.createElement('div')
    host.addEventListener('click', onParentClick)
    document.body.appendChild(host)
    const wrapper = mount(AnnotationReferenceText, {
      attachTo: host,
      props: {
        annotations: [makeAnnotation('annotation-2', 4)],
        content: 'See #2.',
        references: [{
          type: 'annotation',
          annotationId: 'annotation-2',
          label: '#2',
        }],
      },
    })

    const reference = wrapper.get('button.annotation-reference-link')
    expect(reference.text()).toBe('#4')
    await reference.trigger('click')

    expect(wrapper.emitted('activate')?.[0]).toEqual(['annotation-2'])
    expect(onParentClick).not.toHaveBeenCalled()
    wrapper.unmount()
    host.remove()
  })

  it('shows a missing target as unavailable and non-interactive', () => {
    const wrapper = mount(AnnotationReferenceText, {
      props: {
        annotations: [],
        content: 'See #2.',
        references: [{
          type: 'annotation',
          annotationId: 'missing',
          label: '#2',
        }],
      },
    })

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('.annotation-reference-unavailable').text()).toBe('#2')
  })
})
