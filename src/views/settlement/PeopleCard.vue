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

<script setup>
import PersonCard from './PersonCard.vue';

const props = defineProps({
  people: Array
});

const emit = defineEmits(['addPerson', 'update:people', 'removePerson']);

const updatePerson = (updatedPerson) => {
  const index = props.people.findIndex(p => p.id === updatedPerson.id);
  if (index !== -1) {
    const newPeople = [...props.people];
    newPeople[index] = updatedPerson;
    emit('update:people', newPeople);
  }
};

const removePerson = (id) => {
  emit('removePerson', id);
};
</script>
