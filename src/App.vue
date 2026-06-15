<template>
  <div class="flex flex-col h-screen bg-background text-foreground">
    <header class="flex items-center gap-1 px-4 h-11 border-b shrink-0 select-none">
      <div class="flex items-center gap-2 mr-6">
        <span class="font-semibold text-sm text-primary">InkLayer</span>
        <span class="text-xs text-muted-foreground">Vue</span>
      </div>
      <Tabs :default-value="activeTab" @update:model-value="activeTab = $event">
        <TabsList>
          <TabsTrigger value="viewer">📖 Viewer</TabsTrigger>
          <TabsTrigger value="annotator">✏️ Annotator</TabsTrigger>
        </TabsList>
      </Tabs>
      <div class="flex-1" />
      <Button variant="outline" size="icon" class="size-8" @click="toggleDark">
        <span>{{ isDark ? '☀️' : '🌙' }}</span>
      </Button>
    </header>

    <div v-if="activeTab === 'viewer'" class="flex-1 min-h-0">
      <PdfViewer
        url="https://arxiv.org/pdf/2109.00054.pdf"
        title="PDF Viewer — Read Only"
        :appearance="isDark ? 'dark' : 'light'"
        :show-text-layer="false"
      />
    </div>

    <PdfAnnotator
      v-else
      url="https://arxiv.org/pdf/2109.00054.pdf"
      title="PDF Annotator — Full Tools"
      :appearance="isDark ? 'dark' : 'light'"
      @save="onSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PdfViewer from '@/PdfViewer.vue'
import PdfAnnotator from '@/PdfAnnotator.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

const activeTab = ref<string>('annotator')
const isDark = ref(false)

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

function onSave(annotations: unknown[]) {
  console.log('Saved', annotations.length, 'annotations')
}
</script>
