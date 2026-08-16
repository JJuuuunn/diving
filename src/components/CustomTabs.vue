<template>
  <div
    class="custom-tabs"
    :class="[
      `custom-tabs--${variant}`,
      getSizeClass('custom-tabs', size),
      { 'is-block': block }
    ]"
  >
    <div
      ref="tabListRef"
      class="custom-tabs__list"
      role="tablist"
      aria-label="Tabs"
    >
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        :id="`tab-${tab.id}`"
        ref="tabRefs"
        type="button"
        class="custom-tabs__tab"
        :class="{
          'is-active': activeId === tab.id,
          'is-disabled': tab.disabled
        }"
        role="tab"
        :aria-selected="activeId === tab.id"
        :aria-controls="`tabpanel-${tab.id}`"
        :aria-disabled="tab.disabled || undefined"
        :tabindex="activeId === tab.id ? 0 : -1"
        :disabled="tab.disabled"
        @click="selectTab(tab.id)"
        @keydown="handleKeyDown($event, index)"
      >
        <i v-if="tab.icon" class="custom-tabs__icon" :class="tab.icon" aria-hidden="true"></i>
        <slot name="tab" :tab="tab">
          <span class="custom-tabs__label">{{ tab.label }}</span>
          <CustomBadge
            v-if="tab.badge !== undefined && tab.badge !== ''"
            size="xs"
            pill
            class="custom-tabs__badge"
          >
            {{ tab.badge }}
          </CustomBadge>
        </slot>
      </button>

      <div
        v-if="variant !== 'pill'"
        class="custom-tabs__indicator"
        :style="indicatorStyle"
        aria-hidden="true"
      ></div>
    </div>

    <div class="custom-tabs__panels">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide, onMounted, nextTick } from 'vue';
import type { TabsProps } from '@/types/inputs';
import { getSizeClass } from '@/utils/size';
import CustomBadge from '@/components/CustomBadge.vue';
import { handleListArrowNav } from '@/composables/useKeyboardNav';

const props = withDefaults(defineProps<TabsProps>(), {
  modelValue: undefined,
  tabs: () => [],
  variant: 'underline',
  size: 'md',
  block: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'change', value: string | number): void;
}>();

const internalTab = ref<string | number>(
  props.modelValue ?? (props.tabs.find((t) => !t.disabled)?.id ?? props.tabs[0]?.id ?? '')
);

const activeId = computed<string | number>({
  get() {
    return props.modelValue !== undefined ? props.modelValue : internalTab.value;
  },
  set(val) {
    internalTab.value = val;
    emit('update:modelValue', val);
    emit('change', val);
  }
});

provide('tabsContext', {
  activeTab: activeId
});

const tabListRef = ref<HTMLElement | null>(null);
const tabRefs = ref<HTMLElement[]>([]);

const indicatorStyle = ref<{ left: string; width: string; opacity: number }>({
  left: '0px',
  width: '0px',
  opacity: 0
});

const selectTab = (id: string | number) => {
  const targetTab = props.tabs.find((t) => t.id === id);
  if (targetTab && !targetTab.disabled) {
    activeId.value = id;
  }
};

const updateIndicator = () => {
  if (!tabListRef.value || !tabRefs.value.length) {
    indicatorStyle.value.opacity = 0;
    return;
  }
  const activeIndex = props.tabs.findIndex((t) => t.id === activeId.value);
  if (activeIndex === -1 || !tabRefs.value[activeIndex]) {
    indicatorStyle.value.opacity = 0;
    return;
  }

  const activeEl = tabRefs.value[activeIndex];
  indicatorStyle.value = {
    left: `${activeEl.offsetLeft}px`,
    width: `${activeEl.offsetWidth}px`,
    opacity: 1
  };
};

const handleKeyDown = (event: KeyboardEvent, currentIndex: number) => {
  const enabledTabs = props.tabs
    .map((tab, idx) => ({ tab, idx }))
    .filter(({ tab }) => !tab.disabled);

  if (!enabledTabs.length) return;

  const currentPos = enabledTabs.findIndex(({ idx }) => idx === currentIndex);
  if (currentPos === -1) return;

  handleListArrowNav(event, currentPos, enabledTabs.length, (nextPos) => {
    const nextTab = enabledTabs[nextPos];
    selectTab(nextTab.tab.id);
    nextTick(() => {
      tabRefs.value[nextTab.idx]?.focus();
    });
  });
};

watch(
  () => [activeId.value, props.variant, props.size, props.tabs],
  async () => {
    await nextTick();
    updateIndicator();
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  updateIndicator();
});
</script>
