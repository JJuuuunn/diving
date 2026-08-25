<template>
  <LogCardHud
    v-if="isHudDesign"
    :log="log"
    :display-log="displayLog"
    :design="design"
    :readonly="readonly"
    :is-editor="isEditor"
    :class="`design-${design}`"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @view="emit('view', $event)"
    @update:hud-layout="emit('update:hudLayout', $event)"
    @update:photo-url="emit('update:photoUrl', $event)"
  />
  <LogCardTicket
    v-else-if="design === 'ticket'"
    :log="log"
    :display-log="displayLog"
    :design="design"
    :readonly="readonly"
    :is-editor="isEditor"
    :class="`design-${design}`"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @view="emit('view', $event)"
  />
  <LogCardSports
    v-else-if="design === 'sports'"
    :log="log"
    :display-log="displayLog"
    :design="design"
    :readonly="readonly"
    :is-editor="isEditor"
    :class="`design-${design}`"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @view="emit('view', $event)"
  />
  <LogCardStandard
    v-else
    :log="log"
    :display-log="displayLog"
    :design="design"
    :readonly="readonly"
    :is-editor="isEditor"
    :class="`design-${design}`"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @view="emit('view', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type {
  DiveLog,
  FreedivingDiveLog,
  FreedivingDiscipline,
  HudLayoutMap,
  LogCardDesign
} from '@/types/logbook';
import LogCardHud from './components/LogCardHud.vue';
import LogCardTicket from './components/LogCardTicket.vue';
import LogCardSports from './components/LogCardSports.vue';
import LogCardStandard from './components/LogCardStandard.vue';

const props = withDefaults(
  defineProps<{
    log: DiveLog;
    design: LogCardDesign;
    readonly?: boolean;
    isEditor?: boolean;
  }>(),
  {
    readonly: false,
    isEditor: false
  }
);

const emit = defineEmits<{
  (event: 'delete', id: string): void;
  (event: 'edit', log: DiveLog): void;
  (event: 'view', log: DiveLog): void;
  (event: 'update:hudLayout', layout: HudLayoutMap): void;
  (event: 'update:photoUrl', url: string): void;
}>();

const isHudDesign = computed(() => props.design === 'hud' || (props.design as string) === 'garmin');

const displayLog = computed<FreedivingDiveLog>(() => {
  if (props.log.type === 'freediving') {
    return props.log;
  }
  const l = props.log as unknown as Record<string, unknown>;
  return {
    ...props.log,
    type: 'freediving',
    diveCount: typeof l.diveCount === 'number' ? l.diveCount : 1,
    apneaSeconds: typeof l.apneaSeconds === 'number' ? l.apneaSeconds : 60,
    discipline: (typeof l.discipline === 'string' ? l.discipline : 'CWT') as FreedivingDiscipline,
    weightKg: typeof l.weightKg === 'number' ? l.weightKg : 0
  };
});
</script>
