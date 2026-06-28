<template>
  <div>
    <PdfAnnotator
      theme="amber"
      :enable-range="true"
      title="PDF ANNOTATOR FULL"
      :url="pdfUrl"
      :default-show-annotations-sidebar="true"
      :user="{ id: '9527', name: 'Lao Mai' }"
      :enable-native-annotations="true"
      locale="en-US"
      :initial-annotations="[]"
      :default-options="defaultOptions"
      :layout-style="{ height: '96vh' }"
      @save="(a) => console.log('Saved:', a)"
      @load="() => console.log('🎉 PDF Loaded')"
      @annotation-added="(a) => console.log('➕', (a as any).id, (a as any).kind)"
      @annotation-deleted="(id) => console.log('➖', id)"
      @annotation-updated="(a) => console.log('✏️', (a as any).id)"
      @annotation-selected="(a, isClick) => console.log('👉', (a as any)?.id, isClick)"
    >
      <!-- ====== Custom Actions (align React Full demo) ====== -->
      <template #actions="{ onSave, getAnnotations, exportToExcel, exportToPdf }">
        <div style="display: flex; gap: 8px">
          <button @click="onSave()">💾 Save (InkLayer)</button>
          <button @click="console.log('Core:', getAnnotations())">📦 Get Annotations</button>
          <button @click="exportToExcel('Export Excel')">📊 Export Excel</button>
          <button @click="exportToPdf('Export PDF')">📄 Export PDF</button>
        </div>
      </template>
    </PdfAnnotator>
  </div>
</template>
<script setup lang="ts">
import PdfAnnotator from '@/PdfAnnotator.vue'
const pdfUrl = 'https://inklayer.dev/inklayer-demo.pdf'

const defaultOptions = {
  colors: ['red'],
  signature: {
    defaultSignature: [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...' // truncated for brevity, will use empty
    ],
    defaultFont: [
      { label: '楷体', value: 'STKaiti', external: false },
      { label: '千图笔锋手写体', value: 'qiantubifengshouxieti', external: false },
      { label: '平方长安体', value: 'PingFangChangAnTi-2', external: false },
    ]
  },
  stamp: { defaultStamp: [] }
}
</script>
