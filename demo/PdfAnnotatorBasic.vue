<template>
    <PdfAnnotator
        title="PDF ANNOTATOR"
        :layout-style="{ height: '96vh' }"
        locale="en-US"
        :url="pdfUrl"
        :user="{ id: 'u1', name: 'Alice' }"
        @save="(a) => console.log('Saved:', a)"
        @load="() => console.log('🎉 PDF Loaded')"
        @annotation-added="(a) => console.log('➕', a)"
        @annotation-deleted="(id) => console.log('➖', id)"
        @annotation-updated="(a) => console.log('✏️', (a as any).id)"
    />
</template>

<script setup lang="ts">
import PdfAnnotator from '@/PdfAnnotator.vue'
const pdfUrl = new URL('./compressed.tracemonkey-pldi-09.pdf', import.meta.url).href
</script>
