<template>
  <Teleport to="body">
    <div v-if="visible" class="showcode-overlay" @click.self="close">
      <div class="showcode-dialog">
        <div class="showcode-header">
          <span class="showcode-filename">{{ props.filename }}</span>
          <div class="showcode-actions">
            <button class="showcode-btn" @click="handleCopy">{{ copied ? '✓ 已复制' : '📋 复制' }}</button>
            <button class="showcode-btn showcode-btn-close" @click="close">✕</button>
          </div>
        </div>
        <div class="showcode-body">
          <pre class="showcode-pre"><code v-html="highlighted"></code></pre>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import typescript from 'highlight.js/lib/languages/typescript'
import 'highlight.js/styles/atom-one-dark.css'

hljs.registerLanguage('xml', xml)
hljs.registerLanguage('typescript', typescript)

const props = defineProps<{ filename: string; code: string }>()

const visible = ref(false)
const copied = ref(false)

function open() {
  visible.value = true
  document.body.style.overflow = 'hidden'
}

function close() {
  visible.value = false
  document.body.style.overflow = ''
}

const highlighted = computed(() => hljs.highlight(props.code, { language: 'xml' }).value)

async function handleCopy() {
  try { await navigator.clipboard.writeText(props.code) } catch { /* */ }
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

defineExpose({ open })
</script>

<style scoped>
.showcode-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.showcode-dialog {
  width: 100%; max-width: 860px; max-height: 85vh;
  border-radius: 12px; background: #0d1117;
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
  display: flex; flex-direction: column; overflow: hidden;
}
.showcode-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; border-bottom: 1px solid #30363d; flex-shrink: 0;
}
.showcode-filename { font-size: 13px; font-family: monospace; color: #8b949e; }
.showcode-actions { display: flex; align-items: center; gap: 8px; }
.showcode-btn {
  font-size: 12px; padding: 4px 12px; border-radius: 6px;
  border: 1px solid #30363d; background: #21262d; color: #c9d1d9;
  cursor: pointer; transition: all .15s;
}
.showcode-btn:hover { background: #30363d; border-color: #8b949e; }
.showcode-btn-close { padding: 4px 8px; font-size: 14px; }
.showcode-body { overflow: auto; flex: 1; }
.showcode-pre {
  margin: 0; padding: 18px; font-size: 13px; line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  white-space: pre; tab-size: 2; color: #abb2bf; background: #282c34;
}
.showcode-pre :deep(*) { font-family: inherit; }
</style>
