<template>
  <PdfViewer v-if="pdfData" title="PDF VIEWER WITH DATA" :data="pdfData" locale="en-US" :layout-style="{ width: '100vw', height: '96vh' }" />
  <div v-else class="flex items-center justify-center h-96 text-sm text-muted-foreground">Loading PDF...</div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PdfViewer from '@/PdfViewer.vue'
const pdfUrl = 'https://inklayer.dev/inklayer-demo.pdf'
const pdfData = ref<ArrayBuffer | null>(null)
onMounted(async () => { const r = await fetch(pdfUrl); pdfData.value = await r.arrayBuffer(); console.log('PDF data:', pdfData.value) })
</script>
