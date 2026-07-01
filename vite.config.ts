import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcssVite from '@tailwindcss/vite'
import prefixSelector from 'postcss-prefix-selector'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isPlayground = mode === 'playground'
  const resolveConfig = { alias: { '@': resolve(__dirname, 'src') } }

  if (isPlayground) {
    return {
      plugins: [vue(), tailwindcssVite()],
      resolve: resolveConfig,
      server: { port: 5173, open: '/playground/' },
    }
  }

  return {
    plugins: [vue(), tailwindcssVite()],
    publicDir: false,
    resolve: resolveConfig,
    css: {
      postcss: {
        plugins: [
          prefixSelector({
            prefix: 'body.inklayer-app',
            exclude: [/^:root$/, /^html$/, /^body$/, /^\*$/, /^::before$/, /^::after$/, /^\.dark$/, /^\[data-theme/],
            transform(prefix: string, selector: string) {
              if (selector.startsWith('@')) return selector
              if (selector.includes('#InkLayer') || selector.includes('body.inklayer-app')) return selector
              const parts = selector.split(',').map(s => `${prefix} ${s.trim()}`).join(', ')
              return parts
            },
          } as any),
        ],
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'InkLayerVue',
        formats: ['es', 'cjs'],
        fileName: (format) => `inklayer-vue.${format === 'es' ? 'mjs' : 'cjs'}`,
      },
      rollupOptions: {
        external: ['vue', 'pinia', 'pdfjs-dist', 'konva', 'exceljs', 'file-saver', /^pdfjs-dist\/(?!.*\?url)/, /^konva\//],
        output: {
          globals: { vue: 'Vue', pinia: 'Pinia', 'pdfjs-dist': 'pdfjsLib', konva: 'Konva' },
          exports: 'named',
          assetFileNames: (a) => a.name === 'style.css' ? 'inklayer-vue.css' : (a.name ?? 'assets/[name][extname]'),
        },
      },
      cssCodeSplit: false,
    },
  }
})
