<template>
  <div class="page-container">
    <header class="page-header">
      <h1 class="fade-in-up">
        <span class="chunk">Deep Code,</span>
        <span class="chunk">Deep Breath</span>
      </h1>
      <p>필요한 기능을 하나씩 직접 만드는 JJuuuunn의 작업실.</p>
    </header>
    <main class="dashboard-cards">
      <RouterLink :to="{ name: RouterName.Settlement }" class="dashboard-card">
        <div class="card-icon">
          <img src="@/assets/icons/calculator.svg" alt="Calculator" />
        </div>
        <div class="card-info">
          <h2>정산 요정</h2>
          <p>풀장 입장료 정산하러 가기</p>
        </div>
        <div class="card-go">→</div>
      </RouterLink>

      <div class="dashboard-card disabled">
        <div class="card-icon">
          <img src="@/assets/icons/book.svg" alt="Book" />
        </div>
        <div class="card-info">
          <h2>문제 은행</h2>
          <p>Coming Soon...</p>
        </div>
      </div>
      
      <div class="dashboard-card disabled">
        <div class="card-icon">
          <img src="@/assets/icons/diving-mask.svg" alt="Diving Mask" />
        </div>
        <div class="card-info">
          <h2>생각중...</h2>
          <p>Coming Soon...</p>
        </div>
      </div>
      
      <div class="dashboard-card disabled">
        <div class="card-icon">
          <img src="@/assets/icons/diving-mask.svg" alt="Diving Mask" />
        </div>
        <div class="card-info">
          <h2>추천해주세요!!!</h2>
          <p>Coming Soon...</p>
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
