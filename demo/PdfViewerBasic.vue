<template>
  <PdfViewer title="PDF VIEWER" :url="pdfUrl" :layout-style="{ width: '100vw', height: '96vh' }" />
</template>
<script setup lang="ts">
import PdfViewer from '@/PdfViewer.vue'
const pdfUrl = new URL('./compressed.tracemonkey-pldi-09.pdf', import.meta.url).href
</script>
