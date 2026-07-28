<template>
  <section class="card">
    <div class="card-header people-header">
      <h2 class="card-title people-title">
        <i class="fa-solid fa-users"></i> 참여 인원
        <span class="people-count">{{ people.length }}명</span>
      </h2>
      <CustomButton @click="emit('addPerson')" class="add-person-btn">
        <i class="fa-solid fa-plus"></i> 추가
      </CustomButton>
    </div>
    <div class="people-list">
      <PersonCard
        v-for="(_, index) in people"
        :key="people[index].id"
        v-model="people[index]"
        :can-be-deleted="people.length > 2"
        @remove="emit('removePerson', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Person } from '@/types/settlement';
import PersonCard from './PersonCard.vue';

const people = defineModel<Person[]>({ required: true });
const emit = defineEmits<{
  (e: 'addPerson'): void;
  (e: 'removePerson', id: number): void;
}>();
</script>