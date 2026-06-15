import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    // 使用 jsdom 模拟浏览器环境
    environment: 'jsdom',
    // 全局 API（无需每次 import describe/it/expect）
    globals: true,
    // 测试文件匹配模式
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // 排除的文件
    exclude: ['node_modules', 'dist'],
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/main.ts',
        'src/env.d.ts',
      ],
    },
    // CSS 处理
    css: false,
  },
})
