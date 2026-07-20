import { describe, expect, it } from 'vitest'
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
