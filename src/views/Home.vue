<template>
  <div class="page-container">
    <header class="page-header">
      <h1>Let's Dive In</h1>
      <p>Organize your underwater adventures with ease.</p>
    </header>
    <main class="dashboard-cards">
      <RouterLink :to="{ name: RouterName.Settlement }" class="dashboard-card">
        <div class="card-icon">
          <img src="@/assets/icons/calculator.svg" alt="Calculator" />
        </div>
        <div class="card-info">
          <h2>Settlement</h2>
          <p>Cost splitting for trips</p>
        </div>
        <div class="card-go">→</div>
      </RouterLink>

      <div class="dashboard-card disabled">
        <div class="card-icon">
          <img src="@/assets/icons/book.svg" alt="Book" />
        </div>
        <div class="card-info">
          <h2>Quiz Bank</h2>
          <p>Coming Soon</p>
        </div>
      </div>
      
      <div class="dashboard-card disabled">
        <div class="card-icon">
          <img src="@/assets/icons/diving-mask.svg" alt="Diving Mask" />
        </div>
        <div class="card-info">
          <h2>Thinking</h2>
          <p>Coming Soon</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterName } from '@/mappings/enum';
</script>

<style lang="scss">
@import '@/assets/scss/views/Home.scss';
</style>
