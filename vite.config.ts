import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcssVite from '@tailwindcss/vite'
import prefixSelector from 'postcss-prefix-selector'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const PDF_WORKER_IMPORT = 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
const PDF_IMAGE_FILES = [
  'altText_add.svg',
  'altText_done.svg',
  'cursor-editorFreeHighlight.svg',
  'cursor-editorFreeText.svg',
  'cursor-editorInk.svg',
  'cursor-editorTextHighlight.svg',
  'editor-toolbar-delete.svg',
  'toolbarButton-editorHighlight.svg',
  'toolbarButton-menuArrow.svg',
]

const externalDependencies = [
  '@floating-ui/dom',
  'class-variance-authority',
  'clsx',
  'exceljs',
  'file-saver',
  'konva',
  'pdf-lib',
  'pdfjs-dist',
  'pinia',
  'reka-ui',
  'tailwind-merge',
  'vue',
  'vue-i18n',
  'web-highlighter',
]

function isExternalDependency(id: string) {
  if (id === PDF_WORKER_IMPORT) return false
  return externalDependencies.some(
    dependency => id === dependency || id.startsWith(`${dependency}/`)
  )
}

function pdfAssetsPlugin() {
  const virtualWorkerId = '\0inklayer-pdf-worker-url'
  const workerPath = resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs')
  const imagesPath = resolve(__dirname, 'node_modules/pdfjs-dist/web/images')

  return {
    name: 'inklayer-pdf-assets',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id === PDF_WORKER_IMPORT) return virtualWorkerId
    },
    load(id: string) {
      if (id !== virtualWorkerId) return
      const referenceId = this.emitFile({
        type: 'asset',
        fileName: 'pdf.worker.min.mjs',
        source: readFileSync(workerPath),
      })
      return `export default import.meta.ROLLUP_FILE_URL_${referenceId}`
    },
    buildStart() {
      for (const fileName of PDF_IMAGE_FILES) {
        this.emitFile({
          type: 'asset',
          fileName: `images/${fileName}`,
          source: readFileSync(resolve(imagesPath, fileName)),
        })
      }
    },
  }
}

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
    plugins: [
      vue(),
      tailwindcssVite(),
      pdfAssetsPlugin(),
      dts({
        include: ['src/**/*'],
        exclude: ['playground/**', '**/*.test.ts'],
        insertTypesEntry: true,
        rollupTypes: true,
      }),
    ],
    publicDir: false,
    resolve: resolveConfig,
    css: {
      postcss: {
        plugins: [
          prefixSelector({
            prefix: 'body.inklayer-app',
            exclude: [/^:root$/, /^html$/, /^body$/, /^\*$/, /^::before$/, /^::after$/, /^\.dark(?:\s|$)/, /^\[data-theme/, /^\.inklayer-app$/, /^:host$/],
            transform(prefix: string, selector: string) {
              // postcss-prefix-selector splits comma-separated selectors and calls
              // transform for EACH sub-selector individually — not the full string
              const trimmed = selector.trim()
              if (selector.startsWith('@')) return selector
              if (trimmed.startsWith(':where(')) return selector
              if (trimmed.includes('#InkLayer') || trimmed.includes('body.inklayer-app')) return trimmed
              if (/^\.dark/.test(trimmed)) return trimmed
              if (/^\.inklayer-app$/.test(trimmed)) return trimmed
              if (/^:host$/.test(trimmed)) return trimmed

              // Split on unescaped commas only (\, inside class names like
              // .shadow-[rgba(0\,0\,0\,0.1)] must not be treated as selector separators)
              const COMMA_PLACEHOLDER = '\x00INK_CS\x00'
              const escaped = selector.replace(/\\,/g, COMMA_PLACEHOLDER)
              const parts = escaped.split(',').map(s => {
                const st = s.replace(new RegExp(COMMA_PLACEHOLDER, 'g'), '\\,').trim()
                if (st.includes('#InkLayer') || st.includes('body.inklayer-app')) return st
                if (/^\.dark/.test(st)) return st
                if (/^\.inklayer-app$/.test(st)) return st
                if (/^:host$/.test(st)) return st
                return `${prefix} ${st}`
              }).join(', ')
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
        cssFileName: 'inklayer-vue',
        formats: ['es', 'cjs'],
        fileName: (format) => `index.${format === 'es' ? 'es' : 'cjs'}.js`,
      },
      rollupOptions: {
        external: isExternalDependency,
        output: {
          globals: { vue: 'Vue', pinia: 'Pinia', 'pdfjs-dist': 'pdfjsLib', konva: 'Konva' },
          exports: 'named',
          assetFileNames: (a) => a.name === 'style.css' ? 'inklayer-vue.css' : (a.name ?? 'assets/[name][extname]'),
        },
      },
      cssCodeSplit: false,
      sourcemap: false,
      emptyOutDir: true,
      copyPublicDir: false,
    },
  }
})
