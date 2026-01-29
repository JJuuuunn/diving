<template>
  <section class="card">
    <div class="card-header people-header">
      <h2 class="card-title people-title">
        <i class="fa-solid fa-users"></i> 참여 인원
        <span class="people-count">{{ people.length }}명</span>
      </h2>
      <button @click="emit('addPerson')" class="add-person-btn">
        <i class="fa-solid fa-plus"></i> 추가
      </button>
    </div>
    <div class="people-list">
      <PersonCard
        v-for="person in people"
        :key="person.id"
        :person="person"
        :can-be-deleted="people.length > 2"
        @update:person="updatePerson"
        @remove="removePerson"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import PersonCard from './PersonCard.vue';

// Person 타입 정의 (임시, 실제로는 types.ts에서 import 권장)
interface Person {
  id: number;
  name: string;
  isBooker: boolean;
  isMember: boolean;
  prepaid: number;
  bank: string;
  account: string;
}

const props = defineProps<{
  people: Person[];
}>();

const emit = defineEmits<{
  (e: 'addPerson'): void;
  (e: 'update:people', people: Person[]): void;
  (e: 'removePerson', id: number): void;
}>();

const updatePerson = (updatedPerson: Person) => {
  const index = props.people.findIndex(p => p.id === updatedPerson.id);
  if (index !== -1) {
    const newPeople = [...props.people];
    newPeople[index] = updatedPerson;
    emit('update:people', newPeople);
  }
};

const removePerson = (id: number) => {
  emit('removePerson', id);
};
</script>