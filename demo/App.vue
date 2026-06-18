<template>
  <div class="flex flex-col h-screen bg-background text-foreground">
    <header class="flex items-center gap-1 px-4 h-11 shrink-0 select-none overflow-x-auto">
      <span class="font-semibold text-sm mr-4 shrink-0 flex items-center gap-1.5">
        <img src="/logo.svg" alt="InkLayer" class="size-5" />
        InkLayer Vue
      </span>
      <Tabs :default-value="activeTab" @update:model-value="activeTab = $event">
        <TabsList>
          <TabsTrigger value="PdfViewerBasic">PdfViewer Basic</TabsTrigger>
          <TabsTrigger value="PdfViewerData">PdfViewer Data</TabsTrigger>
          <TabsTrigger value="PdfViewerCustom">PdfViewer Custom</TabsTrigger>
          <TabsTrigger value="PdfAnnotatorBasic">PdfAnnotator Basic</TabsTrigger>
          <TabsTrigger value="PdfAnnotatorCustom">PdfAnnotator Custom</TabsTrigger>
          <TabsTrigger value="PdfAnnotatorFull">PdfAnnotator Full</TabsTrigger>
        </TabsList>
      </Tabs>
      <div class="flex-1" />
      <Button variant="outline" size="sm" class="h-8 shrink-0 gap-1 text-xs" @click="openCode">
        &lt;/&gt; Show Code
      </Button>
      <Button variant="outline" size="icon" class="size-8 shrink-0" @click="toggleDark">
        {{ isDark ? '☀️' : '🌙' }}
      </Button>

    <a href="https://github.com/Laomai-codefee/inklayer-vue" target="_blank" rel="noopener noreferrer"
        :style="{display: 'inline-flex', alignItems: 'center'}">
        <img
            src="https://img.shields.io/github/stars/Laomai-codefee/inklayer-vue?style=social"
            alt="GitHub stars"
            :style="{ height: 20, marginRight: 10 }"
        />
    </a>

    </header>

    <div class="flex-1 min-h-0">
      <PdfViewerBasic v-if="activeTab === 'PdfViewerBasic'" />
      <PdfViewerData v-else-if="activeTab === 'PdfViewerData'" />
      <PdfViewerCustom v-else-if="activeTab === 'PdfViewerCustom'" />
      <PdfAnnotatorBasic v-else-if="activeTab === 'PdfAnnotatorBasic'" />
      <PdfAnnotatorCustom v-else-if="activeTab === 'PdfAnnotatorCustom'" />
      <PdfAnnotatorFull v-else-if="activeTab === 'PdfAnnotatorFull'" />
    </div>

    <ShowCode ref="showCodeRef" :filename="currentDemo" :code="currentCode" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import ShowCode from './components/ShowCode.vue'
import { snippets } from './snippets'
import PdfViewerBasic from './PdfViewerBasic.vue'
import PdfViewerData from './PdfViewerData.vue'
import PdfViewerCustom from './PdfViewerCustom.vue'
import PdfAnnotatorBasic from './PdfAnnotatorBasic.vue'
import PdfAnnotatorCustom from './PdfAnnotatorCustom.vue'
import PdfAnnotatorFull from './PdfAnnotatorFull.vue'

const activeTab = ref('PdfViewerBasic')
const showCodeRef = ref<InstanceType<typeof ShowCode> | null>(null)

const currentDemo = computed(() => `${activeTab.value}.vue`)
const currentCode = computed(() => snippets[activeTab.value] || '')

function openCode() {
  showCodeRef.value?.open()
}

// Dark mode
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = ref(prefersDark)
document.documentElement.classList.toggle('dark', prefersDark)

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>
