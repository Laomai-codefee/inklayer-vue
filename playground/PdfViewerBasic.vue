<template>
  <PdfViewer title="PDF VIEWER" :enable-range="false" :url="pdfUrl" :layout-style="{ width: '100%', height: '100%' }" />
</template>
<script setup lang="ts">
import PdfViewer from '@/PdfViewer.vue'
const pdfUrl = 'https://inklayer.dev/inklayer-demo.pdf'
</script>
