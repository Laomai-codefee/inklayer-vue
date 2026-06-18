<template>
  <PdfViewer title="PDF VIEWER" :url="pdfUrl" :layout-style="{ width: '100vw', height: '96vh' }" />
</template>
<script setup lang="ts">
import PdfViewer from '@/PdfViewer.vue'
const pdfUrl = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf"
</script>
