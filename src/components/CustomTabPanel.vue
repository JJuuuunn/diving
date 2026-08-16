<template>
  <div
    v-show="isActive"
    :id="panelId"
    class="custom-tab-panel"
    role="tabpanel"
    :aria-labelledby="tabId"
    :tabindex="0"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from 'vue';

const props = defineProps<{
  value: string | number;
  id?: string;
}>();

const tabsContext = inject<{ activeTab: Ref<string | number> } | null>('tabsContext', null);

const isActive = computed(() => {
  if (!tabsContext) return true;
  return tabsContext.activeTab.value === props.value;
});

const panelId = computed(() => props.id || `tabpanel-${props.value}`);
const tabId = computed(() => `tab-${props.value}`);
</script>
