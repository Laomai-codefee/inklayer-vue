<template>
  <div class="flex flex-col h-screen bg-background text-foreground">
    <header v-if="!headless" class="flex h-11 shrink-0 select-none items-center justify-between gap-4 border-b border-border px-3">
      <span class="flex shrink-0 items-center gap-1.5 text-sm font-semibold">
        <img src="/logo.svg" alt="InkLayer" class="size-5" />
        InkLayer Vue Demo
      </span>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" class="h-8 shrink-0 gap-1 text-xs" @click="openCode">
          &lt;/&gt; Show Code
        </Button>
        <Button variant="outline" size="icon" class="size-8 shrink-0" @click="toggleDark">
          {{ isDark ? '☀️' : '🌙' }}
        </Button>
        <a
          href="https://github.com/Laomai-codefee/inklayer-vue"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center"
        >
          <img
            src="https://img.shields.io/github/stars/Laomai-codefee/inklayer-vue?style=social"
            alt="GitHub stars"
            class="h-5"
          />
        </a>
      </div>
    </header>

    <Tabs
      :model-value="activeTab"
      orientation="vertical"
      class="flex min-h-0 min-w-0 flex-1 overflow-hidden"
      @update:model-value="activeTab = $event"
    >
      <aside v-if="!headless" class="w-56 shrink-0 overflow-y-auto border-r border-border bg-muted/30" aria-label="Playground examples">
        <TabsList class="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-none bg-transparent p-2">
          <TabsTrigger
            v-for="demo in DEMOS"
            :key="demo.value"
            :value="demo.value"
            class="w-full justify-start px-3 py-2 text-left data-[state=active]:bg-accent data-[state=active]:shadow-none"
          >
            {{ demo.label }}
          </TabsTrigger>
        </TabsList>
      </aside>

      <main class="min-h-0 min-w-0 flex-1 overflow-hidden">
        <PdfViewerBasic v-if="activeTab === 'PdfViewerBasic'" />
        <PdfViewerData v-else-if="activeTab === 'PdfViewerData'" />
        <PdfViewerCustom v-else-if="activeTab === 'PdfViewerCustom'" />
        <PdfAnnotatorBasic v-else-if="activeTab === 'PdfAnnotatorBasic'" />
        <PdfAnnotatorCustom v-else-if="activeTab === 'PdfAnnotatorCustom'" />
        <PdfAnnotatorFull v-else-if="activeTab === 'PdfAnnotatorFull'" />
        <PdfAnnotatorPermissions v-else-if="activeTab === 'PdfAnnotatorPermissions'" />
      </main>
    </Tabs>

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
import PdfAnnotatorPermissions from './PdfAnnotatorPermissions.vue'

const DEMOS = [
  { value: 'PdfAnnotatorBasic', label: 'PdfAnnotator Basic' },
  { value: 'PdfAnnotatorCustom', label: 'PdfAnnotator Custom' },
  { value: 'PdfAnnotatorFull', label: 'PdfAnnotator Full' },
  { value: 'PdfAnnotatorPermissions', label: 'Collaboration Permissions' },
  { value: 'PdfViewerBasic', label: 'PdfViewer Basic' },
  { value: 'PdfViewerData', label: 'PdfViewer Data' },
  { value: 'PdfViewerCustom', label: 'PdfViewer Custom' },
]

const activeTab = ref('PdfAnnotatorBasic')
const headless = ref(window.location.hash === '#headless')
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
