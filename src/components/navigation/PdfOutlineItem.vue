<template>
  <li
    role="treeitem"
    class="m-0 p-0"
    :aria-expanded="hasChildren ? expanded : undefined"
  >
    <div
      class="grid min-h-8 grid-cols-[24px_minmax(0,1fr)] items-start rounded-md py-0.5 pr-1.5"
      :style="{ paddingLeft: `${8 + Math.min(depth, 8) * 12}px` }"
    >
      <button
        v-if="hasChildren"
        type="button"
        class="flex min-h-7 cursor-pointer appearance-none items-center self-stretch justify-center rounded-sm border-0 bg-transparent p-0 text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        :aria-label="t(expanded ? 'viewer.navigation.collapseOutlineItem' : 'viewer.navigation.expandOutlineItem', { title })"
        :aria-controls="`${itemKey}-children`"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <span
          class="size-3 text-muted-foreground transition-transform duration-150"
          :class="expanded ? 'rotate-90' : ''"
          aria-hidden="true"
        >
          <Icon name="outlineChevron" :size="12" />
        </span>
      </button>
      <span v-else class="w-6" />

      <a
        v-if="item.url"
        class="outline-title w-full min-w-0 cursor-pointer appearance-none rounded-sm border-0 px-1 py-1.5 text-left leading-[1.35] text-foreground no-underline [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        :class="selected ? 'bg-primary/15 hover:bg-primary/15' : 'bg-transparent hover:bg-accent'"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        :style="titleStyle"
        @click="emit('navigate', item, itemKey)"
      >
        {{ title }}
      </a>
      <button
        v-else
        type="button"
        class="outline-title w-full min-w-0 cursor-pointer appearance-none rounded-sm border-0 px-1 py-1.5 text-left leading-[1.35] text-foreground [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:text-muted-foreground"
        :class="selected ? 'bg-primary/15 hover:bg-primary/15' : 'bg-transparent hover:bg-accent'"
        :disabled="!canNavigate && !hasChildren"
        :aria-current="selected ? 'location' : undefined"
        :style="titleStyle"
        @click="handleTitleClick"
      >
        {{ title }}
      </button>
    </div>

    <ul v-if="hasChildren && expanded" :id="`${itemKey}-children`" role="group" class="m-0 list-none p-0">
      <PdfOutlineItem
        v-for="(child, index) in item.items"
        :key="`${itemKey}-${index}`"
        :item="child"
        :item-key="`${itemKey}-${index}`"
        :depth="depth + 1"
        :selected-item-key="selectedItemKey"
        @navigate="(target, key) => emit('navigate', target, key)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { useT } from '@/composables/useT'
import Icon from '@/components/Icon.vue'
import type { PdfOutlineItemData } from './PdfOutline.vue'

const props = defineProps<{
  item: PdfOutlineItemData
  itemKey: string
  depth: number
  selectedItemKey: string | null
}>()

const emit = defineEmits<{
  navigate: [item: PdfOutlineItemData, itemKey: string]
}>()

const { t } = useT()
const expanded = ref(props.item.count === undefined || props.item.count >= 0)
const hasChildren = computed(() => props.item.items.length > 0)
const title = computed(() => props.item.title.trim() || t('viewer.navigation.untitledOutlineItem'))
const canNavigate = computed(() => props.item.dest !== null)
const selected = computed(() => props.selectedItemKey === props.itemKey)
const titleStyle = computed<CSSProperties>(() => ({
  fontStyle: props.item.italic ? 'italic' : undefined,
  fontWeight: props.item.bold ? 600 : undefined,
}))

function handleTitleClick() {
  if (canNavigate.value) emit('navigate', props.item, props.itemKey)
  else if (hasChildren.value) expanded.value = !expanded.value
}
</script>
