<template>
  <!-- Inline mode: no Popover wrapper, renders directly -->
  <div v-if="!popover" class="flex items-center gap-1 flex-wrap max-w-[160px]">
    <button v-for="color in presets" :key="color" type="button"
      class="size-5 rounded-full border-2 transition-transform hover:scale-110 relative"
      :class="modelValue === color ? 'border-foreground scale-110' : 'border-transparent'"
      :style="{ backgroundColor: color }" @click="selectColor(color)">
      <span v-if="isNearWhite(color)" class="absolute inset-0 rounded-full border border-border/40" />
    </button>
  </div>

  <!-- Popover mode: button trigger + dropdown -->
  <Popover v-else :open="open && !disabled" class="!z-[2100]" @update:open="onOpenChange">
    <template #trigger>
      <button type="button"
        :title="t('common.color')"
        class="relative inline-flex items-center justify-center rounded-md size-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit"
        :disabled="disabled">
        <svg viewBox="0 0 1024 1024" class="size-4" xmlns="http://www.w3.org/2000/svg">
          <path d="M96 837.68888888h832v160H96z" :fill="modelValue" />
          <path d="M429.30646525 163.315053m54.92260742 54.92260743l164.76782227 164.76782227q54.92260742 54.92260742 0 109.84521486l-164.76782227 164.76782228q-54.92260742 54.92260742-109.84521486 0l-164.76782228-164.76782228q-54.92260742-54.92260742 0-109.84521486l164.76782228-164.76782227q54.92260742-54.92260742 109.84521486 0Z" :fill="modelValue" />
          <path d="M364.65047577 163.33699097L262.12304466 60.85098508 320.69831237 2.23429214l153.14905568 153.10763046c2.94119095 2.27838736 5.79953147 4.76390083 8.5335963 7.45654045l234.34249608 234.34249608a82.85044939 82.85044939 0 0 1 0 117.15053543l-234.34249608 234.34249607a82.85044939 82.85044939 0 0 1-117.19196065 0L130.88793283 514.29149456a82.85044939 82.85044939 0 0 1 0-117.15053543l233.76254294-233.80396816z m220.2579197 219.13943862l-0.57995316 0.53852791-161.0612736-161.0612736-226.72025474 226.67882952h454.51756532L584.90839547 382.47642959zM822.68918518 783.3069037a103.56306173 103.56306173 0 0 1-103.56306171-103.56306173c0-57.16681008 87.61435022-161.39267539 103.56306171-161.3926754 15.9487115 0 103.56306173 104.1844401 103.56306173 161.3926754a103.56306173 103.56306173 0 0 1-103.56306173 103.56306173z" fill="currentColor" />
        </svg>
      </button>
    </template>

    <div class="p-3">
      <div class="grid grid-cols-5 gap-2">
        <button v-for="color in presets" :key="color" type="button"
          class="size-6 rounded-full border-2 transition-all duration-150 hover:scale-110 relative"
          :class="modelValue === color ? 'border-primary scale-110' : 'border-foreground/10'"
          :style="{ backgroundColor: color }" @click="selectColor(color)">
          <!-- Ring for near-white colors so they are visible on white bg -->
          <span v-if="isNearWhite(color)" class="absolute inset-0 rounded-full border border-border/40" />
        </button>
      </div>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Popover } from '@/components/ui/popover'
import type { PropType } from 'vue'
import { defaultOptions } from '@/extensions/annotator/const/default_options'
import { useT } from '@/composables/useT'
const { t } = useT()

defineProps({
  modelValue: { type: String, required: true },
  presets: { type: Array as PropType<string[]>, default: () => defaultOptions.colors },
  disabled: { type: Boolean, default: false },
  popover: { type: Boolean, default: true },
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const open = ref(false)

function onOpenChange(val: boolean) { open.value = val }
function selectColor(color: string) { emit('update:modelValue', color); open.value = false }

function isNearWhite(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r + g + b) / 3 > 230
}
</script>
