import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcssVite from '@tailwindcss/vite'
import tailwindcss from '@tailwindcss/postcss'
import prefixSelector from 'postcss-prefix-selector'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo'

  const resolveConfig = {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  }

  if (isDemo) {
    // Demo / development mode — normal tailwind (global, unscoped)
    return {
      plugins: [vue(), tailwindcssVite()],
      resolve: resolveConfig,
      server: {
        port: 5173,
        open: '/demo/',
      },
    }
  }

  // ========== Library build mode ==========
  // All Tailwind styles scoped to #InkLayer so they don't leak
  // into the consumer's project.
  return {
    plugins: [vue()],
    publicDir: false,
    resolve: resolveConfig,
    css: {
      postcss: {
        plugins: [
          tailwindcss() as any,
          prefixSelector({
            prefix: '#InkLayer',
            // Exclude selectors that MUST remain global:
            // - :root, html, body → CSS variables and base reset
            // - .dark → Dark mode toggle on documentElement
            // - * and ::before/::after → Preflight universal reset
            // - [data-theme] → Third-party theme integration
            exclude: [
              /^:root$/,
              /^html$/,
              /^body$/,
              /^\*$/,
              /^::before$/,
              /^::after$/,
              /^\.dark$/,
              /^\[data-theme/,
              // Keep @font-face, @keyframes, @layer, @media global
            ],
            // Transform only CSS rules, not at-rules
            transform(prefix: string, selector: string, _prefixedSelector: string, filePath: string) {
              // Don't prefix at-rules' internal selectors
              if (selector.startsWith('@')) return selector
              // Don't double-prefix
              if (selector.includes('#InkLayer')) return selector
              // Prepend container to every selector
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
        external: [
          'vue',
          'pinia',
          'pdfjs-dist',
          'konva',
          'exceljs',
          'file-saver',
          /^pdfjs-dist\/(?!.*\?url)/,
          /^konva\//,
        ],
        output: {
          globals: {
            vue: 'Vue',
            pinia: 'Pinia',
            'pdfjs-dist': 'pdfjsLib',
            konva: 'Konva',
          },
          exports: 'named',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'inklayer-vue.css'
            return assetInfo.name ?? 'assets/[name][extname]'
          },
        },
      },
      cssCodeSplit: false,
    },
  }
})
