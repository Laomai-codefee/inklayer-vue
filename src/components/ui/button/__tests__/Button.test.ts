import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Button from '../Button.vue'

describe('Button', () => {
  it('forwards the disabled state to the native button', async () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: 'Disabled action' },
    })

    const button = wrapper.get('button')
    await button.trigger('click')

    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
