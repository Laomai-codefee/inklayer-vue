/**
 * lib.test.ts — cn() 工具函数测试
 */
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('应合并多个类名', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('应处理条件类名', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('应处理 undefined 和 null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b')
  })

  it('应去重 Tailwind 冲突类名', () => {
    // px-4 和 px-2 冲突，后者应覆盖前者
    expect(cn('px-4 py-2', 'px-2')).toBe('py-2 px-2')
  })

  it('Tailwind 冲突去重：颜色和尺寸', () => {
    expect(cn('bg-red-500 text-sm', 'bg-blue-500')).toBe('text-sm bg-blue-500')
    expect(cn('w-4 h-4', 'w-8 h-8')).toBe('w-8 h-8')
  })

  it('空输入应返回空字符串', () => {
    expect(cn()).toBe('')
  })

  it('应处理对象条件', () => {
    expect(cn({ active: true, disabled: false })).toBe('active')
  })
})
