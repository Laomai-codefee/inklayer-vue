/**
 * utils.test.ts — 工具函数单元测试
 *
 * 测试 deepMerge, normalizeColor, isSameColor, debounce, once 等纯函数
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { deepMerge, isSameColor, debounce, once } from '@/utils'

// 注意：normalizeColor 是私有函数，通过 isSameColor 间接测试

// =============================================================================
// deepMerge
// =============================================================================
describe('deepMerge', () => {
  it('应深度合并嵌套对象', () => {
    const target = { a: 1, b: { x: 10, y: 20 } }
    const source = { b: { y: 99, z: 30 }, c: 'new' }
    const result = deepMerge(target, source)

    expect(result).toEqual({
      a: 1,
      b: { x: 10, y: 99, z: 30 },
      c: 'new',
    })
  })

  it('数组应直接覆盖（不合并）', () => {
    const target = { colors: ['red', 'blue'], version: 1 }
    const source = { colors: ['green'] }
    const result = deepMerge(target, source)

    expect(result.colors).toEqual(['green'])
    expect(result.colors).toHaveLength(1)
  })

  it('source 中 undefined 值不应覆盖 target', () => {
    const target = { a: 1, b: 2 }
    const source = { b: undefined, c: 3 }
    const result = deepMerge(target, source)

    expect(result.b).toBe(2) // 保留原值
    expect(result.c).toBe(3) // 新值
  })

  it('应处理多层嵌套', () => {
    const target = {
      level1: { level2: { level3: { value: 'old' } } },
    }
    const source = {
      level1: { level2: { level3: { value: 'new', extra: true } } },
    }
    const result = deepMerge(target, source)

    expect(result.level1.level2.level3).toEqual({ value: 'new', extra: true })
  })

  it('source 为 undefined 时应返回 target', () => {
    const target = { a: 1 }
    const result = deepMerge(target, undefined)
    expect(result).toEqual({ a: 1 })
    expect(result).toBe(target) // 同一引用
  })

  it('source 和 target 不同时为 plain object 时应直接返回 source', () => {
    const target = { a: 1 }
    const result = deepMerge(target, 42 as any)
    expect(result).toBe(42)
  })

  it('null 值应被正常覆盖', () => {
    const target = { a: 1 } as any
    const source = { a: null }
    const result = deepMerge(target, source)

    expect(result.a).toBeNull()
  })

  it('应创建新对象不影响原始', () => {
    const target = { a: 1, nested: { x: 1 } }
    const source = { nested: { y: 2 } }
    const result = deepMerge(target, source)

    result.a = 999
    result.nested.x = 999

    expect(target.a).toBe(1)
    expect(target.nested.x).toBe(1)
  })
})

// =============================================================================
// isSameColor（通过 normalizeColor）
// =============================================================================
describe('isSameColor', () => {
  it('相同的 6 位 hex 应返回 true', () => {
    expect(isSameColor('#ff0000', '#ff0000')).toBe(true)
  })

  it('相同的 3 位 hex 应返回 true', () => {
    expect(isSameColor('#f00', '#f00')).toBe(true)
  })

  it('3 位和 6 位 hex 等价应返回 true', () => {
    expect(isSameColor('#f00', '#ff0000')).toBe(true)
  })

  it('大小写不同应等价', () => {
    expect(isSameColor('#FF0000', '#ff0000')).toBe(true)
    expect(isSameColor('#ABC', '#abc')).toBe(true)
  })

  it('rgb 格式应与等价的 hex 相同', () => {
    expect(isSameColor('rgb(255, 0, 0)', '#ff0000')).toBe(true)
    expect(isSameColor('rgb(0, 128, 255)', '#0080ff')).toBe(true)
  })

  it('rgb 带空格应正确处理', () => {
    expect(isSameColor('rgb( 255 , 0 , 0 )', '#ff0000')).toBe(true)
  })

  it('不同的颜色应返回 false', () => {
    expect(isSameColor('#ff0000', '#00ff00')).toBe(false)
    expect(isSameColor('rgb(0, 0, 0)', '#ffffff')).toBe(false)
  })

  it('非法格式应返回 false（不抛异常）', () => {
    expect(isSameColor('not-a-color', '#ffffff')).toBe(false)
    expect(isSameColor('hsl(0, 100%, 50%)', '#ff0000')).toBe(false)
  })

  it('两边都非法应返回 false', () => {
    expect(isSameColor('bad1', 'bad2')).toBe(false)
  })
})

// =============================================================================
// debounce
// =============================================================================
describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应在延迟后执行函数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('多次调用应防抖只执行最后一次', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)
    debounced()

    // 前两次被取消
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('immediate 模式应首次立即执行', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100, true)

    debounced('arg1', 'arg2')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2')

    // 延迟内的调用不应执行
    vi.advanceTimersByTime(50)
    debounced()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('immediate 模式下延迟过后可以再次立即执行', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100, true)

    debounced()
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(150)
    debounced()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('应正确传递参数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('hello', 42, { key: 'value' })
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledWith('hello', 42, { key: 'value' })
  })
})

// =============================================================================
// once
// =============================================================================
describe('once', () => {
  it('应只执行一次函数', () => {
    const fn = vi.fn().mockReturnValue('result')
    const onceFn = once(fn)

    expect(onceFn()).toBe('result')
    expect(onceFn()).toBe('result')
    expect(onceFn()).toBe('result')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('应缓存返回值', () => {
    let counter = 0
    const fn = () => ++counter
    const onceFn = once(fn)

    expect(onceFn()).toBe(1)
    expect(onceFn()).toBe(1)
    expect(counter).toBe(1)
  })

  it('应正确传递参数给原函数', () => {
    const fn = vi.fn().mockReturnValue('ok')
    const onceFn = once(fn)

    onceFn('a', 'b', 'c')
    expect(fn).toHaveBeenCalledWith('a', 'b', 'c')
  })

  it('多次调用应返回相同结果', () => {
    const obj = { value: 42 }
    const fn = vi.fn().mockReturnValue(obj)
    const onceFn = once(fn)

    const r1 = onceFn()
    const r2 = onceFn()

    expect(r1).toBe(r2)
  })
})
